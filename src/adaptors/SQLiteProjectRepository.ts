import type Database from '@tauri-apps/plugin-sql';
import type { ProjectRepository } from '../ports/ProjectRepository';
import { debug } from '@tauri-apps/plugin-log';

export class SQLiteProjectRepository implements ProjectRepository {
	private readonly VIDEO_PATH_CONFIG_NAME = 'video_path';
	private readonly LAST_SAVE_CONFIG_NAME = 'last_save';
	private readonly BACKUP_ID_CONFIG_NAME = 'backup_id';

	constructor(private readonly db: Database) {}

	async addGenericConfiguration(name: string, value: string): Promise<void> {
		debug(`Adding configuration: ${name} = ${value}`);

		await this.db.execute(
			`INSERT INTO configuration (name, value)
            VALUES ($1, $2) ON CONFLICT(name) DO UPDATE SET value = $2`,
			[name, value]
		);
	}

	async getGenericConfiguration(name: string): Promise<string | null> {
		debug(`Getting configuration for: ${name}`);

		const result = await this.db.select<{ value: string }[]>(
			'SELECT value FROM configuration WHERE name = ?',
			[name]
		);

		if (result.length > 0) {
			return result[0].value;
		}

		return null;
	}

	async removeGenericConfiguration(name: string): Promise<void> {
		debug(`Removing configuration: ${name}`);

		await this.db.execute('DELETE FROM configuration WHERE name = ?', [name]);
	}

	async setVideoPath(path: string): Promise<void> {
		debug(`Adding video path: ${path}`);

		await this.db.execute(
			`INSERT INTO configuration (name, value) VALUES ($1, $2) ON CONFLICT(name) DO UPDATE SET value = $2`,
			[this.VIDEO_PATH_CONFIG_NAME, path]
		);
	}

	async getVideoPath(): Promise<string | null> {
		debug(`Getting video path`);

		const result = await this.db.select<{ value: string }[]>(
			'SELECT value FROM configuration WHERE name = ?',
			[this.VIDEO_PATH_CONFIG_NAME]
		);

		if (result.length > 0) {
			return result[0].value;
		}

		return null;
	}

	async removeVideoPath(): Promise<void> {
		debug(`Removing video path`);

		await this.db.execute('DELETE FROM configuration WHERE name = ?', [
			this.VIDEO_PATH_CONFIG_NAME
		]);
	}

	async setLastSavedTimestamp(timestamp: string): Promise<void> {
		debug(`Adding last saved timestamp: ${timestamp}`);

		await this.db.execute(
			`INSERT INTO configuration (name, value) VALUES ($1, $2) ON CONFLICT(name) DO UPDATE SET value = $2`,
			[this.LAST_SAVE_CONFIG_NAME, timestamp]
		);
	}

	async getLastSavedTimestamp(): Promise<string | null> {
		debug(`Getting last saved timestamp`);

		const result = await this.db.select<{ value: string }[]>(
			'SELECT value FROM configuration WHERE name = ?',
			[this.LAST_SAVE_CONFIG_NAME]
		);

		if (result.length > 0) {
			return result[0].value;
		}

		return null;
	}

	async removeLastSavedTimestamp(): Promise<void> {
		debug(`Removing last saved timestamp`);

		await this.db.execute('DELETE FROM configuration WHERE name = ?', [this.LAST_SAVE_CONFIG_NAME]);
	}

	async setBackupId(backupId: string): Promise<void> {
		debug(`Setting backup ID: ${backupId}`);

		await this.db.execute(
			`INSERT INTO configuration (name, value) VALUES ($1, $2) ON CONFLICT(name) DO UPDATE SET value = $2`,
			[this.BACKUP_ID_CONFIG_NAME, backupId]
		);
	}

	async getBackupId(): Promise<string | null> {
		debug(`Getting backup ID`);

		const result = await this.db.select<{ value: string }[]>(
			'SELECT value FROM configuration WHERE name = ?',
			[this.BACKUP_ID_CONFIG_NAME]
		);

		if (result.length > 0) {
			return result[0].value;
		}

		return null;
	}
}
