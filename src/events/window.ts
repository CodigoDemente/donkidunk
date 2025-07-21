import { getCurrentWindow } from '@tauri-apps/api/window';
import { ask } from '@tauri-apps/plugin-dialog';
import { closeDatabase, dumpIntoOriginalDatabase } from '../persistence/database/actions';
import { projectActions } from '../persistence/stores/project/actions';
import { remove } from '@tauri-apps/plugin-fs';

export class WindowEventHandler {
	private unlisteners: (() => void)[] = [];

	constructor() {}

	async init(): Promise<void> {
		this.unlisteners.push(
			await getCurrentWindow().onCloseRequested(this.onCloseRequested.bind(this))
		);
	}

	destroy(): void {
		for (const unlistener of this.unlisteners) {
			unlistener();
		}
		this.unlisteners = [];
	}

	private async onCloseRequested(): Promise<void> {
		const isDirty = projectActions.getProjectDirty();

		if (isDirty) {
			const answer = await ask('You have unsaved changes. Do you want to save before closing?', {
				title: 'Unsaved Changes',
				okLabel: 'Yes',
				cancelLabel: 'No'
			});

			if (answer) {
				await dumpIntoOriginalDatabase(projectActions.getFilePath());
			}
		}

		if (projectActions.getDatabase()) {
			const currentFilePath = projectActions.getCurrentFilePath();

			await closeDatabase();

			await remove(currentFilePath);
		}
	}
}
