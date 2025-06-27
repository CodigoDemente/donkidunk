import type Database from '@tauri-apps/plugin-sql';
import { ProjectRepositoryFactory } from '../../../factories/ProjectRepositoryFactory';
import ProjectStore from './store.svelte';
import { emit } from '@tauri-apps/api/event';

export const projectActions = {
	getProjectDirty(): boolean {
		return ProjectStore.metadata.dirty;
	},

	setProjectDirty(isDirty: boolean): void {
		ProjectStore.metadata.dirty = isDirty;
	},

	async setLastSavedTimestamp(timestamp: string): Promise<void> {
		const repository = ProjectRepositoryFactory.getInstance();
		await repository.setLastSavedTimestamp(timestamp);

		ProjectStore.metadata.timestamp = timestamp;

		await emit('project:dirty');
	},

	getFilePath(): string {
		return ProjectStore.file.originalPath;
	},

	setFilePath(path: string): void {
		ProjectStore.file.originalPath = path;
	},

	getCurrentFilePath(): string {
		return ProjectStore.file.currentPath;
	},

	setCurrentFilePath(path: string): void {
		ProjectStore.file.currentPath = path;
	},

	setDatabase(db: Database | null): void {
		ProjectStore.database = db;
	},

	getDatabase(): Database | null {
		return ProjectStore.database;
	},

	async setBackupId(backupId: string): Promise<void> {
		const repository = ProjectRepositoryFactory.getInstance();
		await repository.setBackupId(backupId);

		ProjectStore.metadata.backupId = backupId;

		await emit('project:dirty');
	},

	async setVideoPath(path: string): Promise<void> {
		const repository = ProjectRepositoryFactory.getInstance();
		await repository.setVideoPath(path);

		ProjectStore.video.path = path;

		await emit('project:dirty');
	}
};
