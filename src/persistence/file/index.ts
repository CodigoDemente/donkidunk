import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { info, error } from '@tauri-apps/plugin-log';
import ProjectData, { StateChangedEmitter } from '../stores/project.svelte';

export class FilePersistence {
	private fileName: string = '';
	private modifiedTimes = 0;

	constructor(fileName: string) {
		this.fileName = fileName;

		StateChangedEmitter.on('stateChanged', this.handleStateChange);
	}

	async load<T = Record<string, unknown>>(): Promise<T | null> {
		try {
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
