import { homeDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import ProjectStore from '../../../persistence/stores/project/store.svelte';
import { closeDatabase, openDatabase } from '../../../persistence/database/index.svelte';
import { copyFile } from '@tauri-apps/plugin-fs';
import { saveProject } from './saveProject';
import { debug } from '@tauri-apps/plugin-log';

export async function saveProjectAs() {
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

	const currDbPath = ProjectStore.file.path;

	await closeDatabase();

	await copyFile(currDbPath, path);

	await openDatabase(path, false, false);

	await saveProject();
}
