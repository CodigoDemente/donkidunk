import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { info, error } from '@tauri-apps/plugin-log';
import ProjectData from '../stores/project/store.svelte';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

class FilePersistence {
	private fileName: string = '';
	private modifiedTimes = 0;
	private isInitialized = false;
	private unListen: (() => void) | null = null;

	constructor(fileName: string) {
		this.fileName = fileName;
	}

	async initialize(): Promise<void> {
		try {
			if (this.isInitialized) {
				throw new Error('FilePersistence already initialized');
			}
			this.isInitialized = true;

			this.unListen = await listen<{ property: string; value?: string }>(
				'project-changed',
				async (event) => {
					await invoke('set_menu_item_enabling_status', {
						menuId: 'save_project',
						enabled: true
					});

					await this.handleStateChange(event.payload.property, event.payload.value);
				}
			);
		} catch (err) {
			error(`Error initializing FilePersistence: ${err}`);
		}
	}

	async destroy(): Promise<void> {
		try {
			if (!this.isInitialized) {
				throw new Error('FilePersistence not initialized');
			}

			this.isInitialized = false;

			if (this.unListen) {
				await this.unListen();
				this.unListen = null;
			}
		} catch (err) {
			error(`Error destroying FilePersistence: ${err}`);
		}
	}

	async load<T = Record<string, unknown>>(): Promise<T | null> {
		try {
			if (!this.isInitialized) {
				throw new Error('FilePersistence not initialized');
			}

			const data = await readTextFile(this.fileName, {
				baseDir: BaseDirectory.AppLocalData
			});

			return JSON.parse(data) as T;
		} catch (error) {
			info(`Error loading file: ${error}`);
			return null;
		}
	}

	async save<T = Record<string, unknown>>(data: T): Promise<void> {
		try {
			if (!this.isInitialized) {
				throw new Error('FilePersistence not initialized');
			}

			const text = JSON.stringify(data);

			await writeTextFile(this.fileName, text, {
				baseDir: BaseDirectory.AppLocalData
			});
		} catch (err) {
			error(`Error saving file: ${err}`);
		}
	}

	async handleStateChange(property: string, value: unknown): Promise<void> {
		this.modifiedTimes++;

		if (this.modifiedTimes < 5) {
			info(`State changed: ${property} = ${value}`);
			return;
		}

		await this.save(ProjectData);
		this.modifiedTimes = 0;
	}
}

const filePersistenceStore = $state(new FilePersistence('dnk-data.json'));

export default filePersistenceStore;
