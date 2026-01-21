import type Database from '@tauri-apps/plugin-sql';
import { ProjectRepositoryFactory } from '../../../factories/ProjectRepositoryFactory';
import ProjectStore from './store.svelte';
import { emit } from '@tauri-apps/api/event';
import type { ProjectData, NewProjectFormData } from './types/Project';
import type { FeedbackType } from '../../../utils/messages';

const projectStore = ProjectStore.getState();

export const projectActions = {
	getProjectDirty(): boolean {
		return projectStore.metadata.dirty;
	},

	setProjectDirty(isDirty: boolean): void {
		projectStore.metadata.dirty = isDirty;
	},

	resetProjectState(): void {
		ProjectStore.reset();
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

	setModal({
		content,
		contentProps,
		title,
		onCancel,
		onSubmit,
		onSubmitText,
		show,
		size
	}: ProjectData['modal']): void {
		projectStore.modal = {
			content,
			contentProps,
			title,
			onCancel,
			onSubmit,
			onSubmitText,
			show,
			size
		};
	},

	closeAndResetModal(): void {
		projectStore.modal = {
			content: null,
			title: undefined,
			onCancel: undefined,
			onSubmit: undefined,
			onSubmitText: undefined,
			show: false,
			size: undefined
		};
	},

	setSnackbar({ title, message, type, mode }: FeedbackType): void {
		projectStore.snackbar = { title, message, type, show: true, mode };
	},

	hideSnackbar(): void {
		projectStore.snackbar.show = false;
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
	},

	setNewProjectFormData(formData: NewProjectFormData | null): void {
		projectStore.newProjectFormData = formData;
	},

	getNewProjectFormData(): NewProjectFormData | null {
		return projectStore.newProjectFormData;
	},

	setReplaceVideoFormData(formData: string | null): void {
		projectStore.replaceVideoFormData = formData;
	},

	getReplaceVideoFormData(): string | null {
		return projectStore.replaceVideoFormData;
	}
};
