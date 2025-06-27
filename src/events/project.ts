import { listen } from '@tauri-apps/api/event';
import { disableSaveProject, enableSaveProject } from '../modules/menu/operations/enableItems';
import { projectActions } from '../persistence/stores/project/actions';

export class ProjectEventHandler {
	private unliseners: (() => void)[] = [];

	constructor() {}

	async init(): Promise<void> {
		this.unliseners.push(
			await listen('project:dirty', () => {
				return this.projectDirty();
			})
		);

		this.unliseners.push(
			await listen('project:saved', () => {
				return this.projectSaved();
			})
		);
	}

	private async projectDirty(): Promise<void> {
		await enableSaveProject();
		projectActions.setProjectDirty(true);
	}

	private async projectSaved(): Promise<void> {
		await disableSaveProject();
		projectActions.setProjectDirty(false);
	}

	async destroy(): Promise<void> {
		for (const unlisten of this.unliseners) {
			await unlisten();
		}
		this.unliseners = [];
	}
}
