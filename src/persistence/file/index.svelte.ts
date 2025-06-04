import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { info, error } from '@tauri-apps/plugin-log';
import ProjectData from '../stores/project/store.svelte';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { StoreScope } from '../stores';

class FilePersistence {
	private fileName: string = '';
	private extension: string = '.json';
	private isInitialized = false;
	private unListen: (() => void) | null = null;
	private autoSave: boolean = false;
	private timer: NodeJS.Timeout | null = null;

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

					await this.handleStateChange(
						StoreScope.PROJECT,
						event.payload.property,
						event.payload.value
					);
				}
			);
		} catch (err) {
			error(`Error initializing FilePersistence: ${err}`);
		}
	}

	enableAutoSave(): void {
		if (!this.isInitialized) {
			error('FilePersistence not initialized, cannot enable auto-save');
			return;
		}
		this.autoSave = true;
		info('Auto-save enabled for FilePersistence');
	}

	disableAutoSave(): void {
		if (!this.isInitialized) {
			error('FilePersistence not initialized, cannot disable auto-save');
			return;
		}
		this.autoSave = false;
		info('Auto-save disabled for FilePersistence');
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

	async load<T = Record<string, unknown>>(scope: StoreScope): Promise<T | null> {
		try {
			if (!this.isInitialized) {
				throw new Error('FilePersistence not initialized');
			}

			const data = await readTextFile(`${this.fileName}_${scope}.${this.extension}`, {
				baseDir: BaseDirectory.AppLocalData
			});

			return JSON.parse(data) as T;
		} catch (error) {
			info(`Error loading file: ${error}`);
			return null;
		}
	}

	async save<T = Record<string, unknown>>(scope: StoreScope, data: T): Promise<void> {
		try {
			if (!this.isInitialized) {
				throw new Error('FilePersistence not initialized');
			}

			const text = JSON.stringify(data);

			await writeTextFile(`${this.fileName}_${scope}.${this.extension}`, text, {
				baseDir: BaseDirectory.AppLocalData
			});
		} catch (err) {
			error(`Error saving file: ${err}`);
		}
	}

	async handleStateChange(scope: StoreScope, property: string, value: unknown): Promise<void> {
		info(`State changed: ${property} = ${value}`);

		if (!this.autoSave) {
			info('Auto-save is disabled, skipping save operation');
			return;
		}

		let data: Record<string, unknown>;

		if (scope === StoreScope.PROJECT) {
			data = ProjectData;
		} else {
			error(`Unsupported store scope: ${scope}`);
			return;
		}

		clearTimeout(this.timer!);

		this.timer = setTimeout(async () => {
			await this.save(scope, data);
			info('Project data auto-saved');
		}, 500);
	}
}

const filePersistenceStore = $state(new FilePersistence('dnk-data'));

export default filePersistenceStore;
