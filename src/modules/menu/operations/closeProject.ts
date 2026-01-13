import { debug } from '@tauri-apps/plugin-log';
import type { Board } from '../../board/context.svelte';
import type { Timeline } from '../../videoplayer/context.svelte';
import { projectActions } from '../../../persistence/stores/project/actions';
import { ask } from '@tauri-apps/plugin-dialog';
import { closeDatabase, dumpIntoOriginalDatabase } from '../../../persistence/database/actions';
import { remove } from '@tauri-apps/plugin-fs';
import { UndoManagerFactory } from '../../../persistence/undo/UndoManagerFactory';

export async function closeProject(board: Board, timeline: Timeline) {
	debug('Close project action triggered');

	await closeDatabaseAndSaveChanges();

	projectActions.resetProjectState();
	board.reset();
	timeline.reset();

	const undoManager = UndoManagerFactory.getInstance();
	undoManager.clear();
}

export async function closeDatabaseAndSaveChanges() {
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
