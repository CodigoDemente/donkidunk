import { debug } from '@tauri-apps/plugin-log';
import { v4 as uuidv4 } from 'uuid';
import { createBackupDatabase } from '../../../persistence/database/actions';
import { enableImportVideo } from './enableItems';
import { projectActions } from '../../../persistence/stores/project/actions';
import { selectProjectPath } from './selectProjectPath';

export async function createNewProject(providedPath?: string) {
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

	const backupId = uuidv4();

	await createBackupDatabase(backupId);

	await projectActions.setLastSavedTimestamp(new Date().toISOString());

	await enableImportVideo();
}
