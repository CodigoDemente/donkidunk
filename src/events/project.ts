import { listen } from '@tauri-apps/api/event';
import { disableSaveProject, enableSaveProject } from '../modules/menu/operations/enableItems';
import { projectActions } from '../persistence/stores/project/actions';
import type { ProjectEnablingState } from './types/ProjectEnablingState';

export class ProjectEventHandler {
	private unlisteners: (() => void)[] = [];
	private projectEnablingState: ProjectEnablingState;

	constructor() {
		this.projectEnablingState = {
			save: false
		};
	}

	async init(): Promise<void> {
		this.unlisteners.push(
			await listen('project:dirty', () => {
				return this.projectDirty();
			})
		);

		this.unlisteners.push(
			await listen('project:saved', () => {
				return this.projectSaved();
			})
		);
	}

	private async projectDirty(): Promise<void> {
		if (!this.projectEnablingState.save) {
			this.projectEnablingState.save = true;
			await enableSaveProject();
		}
		projectActions.setProjectDirty(true);
	}

	private async projectSaved(): Promise<void> {
		if (this.projectEnablingState.save) {
			this.projectEnablingState.save = false;
			await disableSaveProject();
		}
		projectActions.setProjectDirty(false);
	}

	destroy(): void {
		for (const unlisten of this.unlisteners) {
			unlisten();
		}
		this.unlisteners = [];
	}
}
