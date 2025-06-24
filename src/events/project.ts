import { listen } from '@tauri-apps/api/event';
import { disableSaveProject, enableSaveProject } from '../modules/menu/operations/enableItems';
import { setProjectDirty } from '../persistence/stores/project/actions';

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
		setProjectDirty(true);
	}

	private async projectSaved(): Promise<void> {
		await disableSaveProject();
		setProjectDirty(false);
	}

	async destroy(): Promise<void> {
		for (const unlisten of this.unliseners) {
			await unlisten();
		}
		this.unliseners = [];
	}
}
