import type Database from '@tauri-apps/plugin-sql';
import { ProjectRepositoryFactory } from '../../../factories/ProjectRepositoryFactory';
import ProjectStore from './store.svelte';
import { emit } from '@tauri-apps/api/event';

export function getProjectDirty(): boolean {
	return ProjectStore.metadata.dirty;
}

export function setProjectDirty(isDirty: boolean): void {
	ProjectStore.metadata.dirty = isDirty;
}

export async function setLastSavedTimestamp(timestamp: string): Promise<void> {
	const repository = ProjectRepositoryFactory.getInstance();
	await repository.setLastSavedTimestamp(timestamp);

	ProjectStore.metadata.timestamp = timestamp;

	await emit('project:dirty');
}

export function getFilePath(): string {
	return ProjectStore.file.originalPath;
}

export function setFilePath(path: string): void {
	ProjectStore.file.originalPath = path;
}

export function getCurrentFilePath(): string {
	return ProjectStore.file.currentPath;
}

export function setCurrentFilePath(path: string): void {
	ProjectStore.file.currentPath = path;
}

export function setDatabase(db: Database | null): void {
	ProjectStore.database = db;
}

export function getDatabase(): Database | null {
	return ProjectStore.database;
}

export async function setBackupId(backupId: string): Promise<void> {
	const repository = ProjectRepositoryFactory.getInstance();
	await repository.setBackupId(backupId);

	ProjectStore.metadata.backupId = backupId;

	await emit('project:dirty');
}

export async function setVideoPath(path: string): Promise<void> {
	const repository = ProjectRepositoryFactory.getInstance();
	await repository.setVideoPath(path);

	ProjectStore.video.path = path;

	await emit('project:dirty');
}
