import { debug } from '@tauri-apps/plugin-log';
import { v7 as uuidv7 } from 'uuid';
import { createBackupDatabase } from '../../../persistence/database/actions';
import { enableImportVideo } from './enableItems';
import { projectActions } from '../../../persistence/stores/project/actions';
import { selectProjectPath } from './selectProjectPath';
import type { ButtonBoard } from '../../config/types/ButtonBoard';

export async function createNewProject(buttonBoard: ButtonBoard, providedPath?: string) {
	debug('New project action triggered');

	let path = providedPath;

	if (!path) {
		const selectedPath = await selectProjectPath();

		if (!selectedPath) {
			debug('No path selected');
			return;
		}

		path = selectedPath;
	}

	if (path && !path.endsWith('.dnk')) {
		path = `${path}.dnk`;
	}

	if (!path) {
		debug('No valid path available');
		return;
	}

	projectActions.setFilePath(path);

	const backupId = uuidv7();

	await createBackupDatabase(backupId);

	await projectActions.setLastSavedTimestamp(new Date().toISOString());

	if (!buttonBoard.id) {
		buttonBoard.id = uuidv7();
	}

	await enableImportVideo();
}
