import { homeDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { debug } from '@tauri-apps/plugin-log';
import { v4 as uuidv4 } from 'uuid';
import { createBackupDatabase } from '../../../persistence/database/actions';
import { enableImportVideo } from './enableItems';
import { setFilePath, setLastSavedTimestamp } from '../../../persistence/stores/project/actions';

export async function createNewProject() {
	debug('New project action triggered');

	const homePath = await homeDir();

	const path = await save({
		canCreateDirectories: true,
		defaultPath: homePath,
		title: 'Save Donkidunk project',
		filters: [
			{
				extensions: ['dnk'],
				name: 'Donkidunk project file'
			}
		]
	});

	if (!path) {
		debug('No path selected');
		return;
	}

	setFilePath(path);

	const backupId = uuidv4();

	await createBackupDatabase(backupId);

	await setLastSavedTimestamp(new Date().toISOString());

	await enableImportVideo();
}
