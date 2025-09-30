import type Database from '@tauri-apps/plugin-sql';
import { ProjectRepositoryFactory } from '../../../factories/ProjectRepositoryFactory';
import ProjectStore from './store.svelte';
import { emit } from '@tauri-apps/api/event';
import type { ProjectData } from './types/Project';

const projectStore = ProjectStore.getState();

export const projectActions = {
	getProjectDirty(): boolean {
		return projectStore.metadata.dirty;
	},

	setProjectDirty(isDirty: boolean): void {
		projectStore.metadata.dirty = isDirty;
	},

	async setLastSavedTimestamp(timestamp: string): Promise<void> {
		const repository = ProjectRepositoryFactory.getInstance();
		await repository.setLastSavedTimestamp(timestamp);

		projectStore.metadata.timestamp = timestamp;

		await emit('project:dirty');
	},

	getFilePath(): string {
		return projectStore.file.originalPath;
	},

	setFilePath(path: string): void {
		projectStore.file.originalPath = path;
	},

	getCurrentFilePath(): string {
		return projectStore.file.currentPath;
	},

	setCurrentFilePath(path: string): void {
		projectStore.file.currentPath = path;
	},

	setModal({ content, props, title, onCancel, onSubmit, show, size }: ProjectData['modal']): void {
		projectStore.modal = { content, props, title, onCancel, onSubmit, show, size };
	},

	setDatabase(db: Database | null): void {
		projectStore.database = db;
	},

	getDatabase(): Database | null {
		return projectStore.database;
	},

	async setBackupId(backupId: string): Promise<void> {
		const repository = ProjectRepositoryFactory.getInstance();
		await repository.setBackupId(backupId);

		projectStore.metadata.backupId = backupId;

		await emit('project:dirty');
	},

	async setVideoPath(path: string): Promise<void> {
		const repository = ProjectRepositoryFactory.getInstance();
		await repository.setVideoPath(path);

		projectStore.video.path = path;

		await emit('project:dirty');
	}
};
