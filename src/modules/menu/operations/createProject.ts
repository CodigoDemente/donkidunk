import { homeDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { debug } from '@tauri-apps/plugin-log';
import ProjectStore from '../../../persistence/stores/project/store.svelte';
import { openDatabase } from '../../../persistence/database/index.svelte';
import filePersistenceStore from '../../../persistence/file/index.svelte';
import { enableImportVideo, enableSaveProject } from './enableItems';

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

	await openDatabase(path, false, true);

	ProjectStore.file.newlyCreated = true;

	ProjectStore.metadata.timestamp = new Date().toISOString();

	filePersistenceStore.enableAutoSave();

	await enableSaveProject();
	await enableImportVideo();
}
