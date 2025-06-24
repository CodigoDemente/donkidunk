import { homeDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { saveProject } from './saveProject';
import { debug } from '@tauri-apps/plugin-log';
import { setFilePath } from '../../../persistence/stores/project/actions';

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

	setFilePath(path);

	await saveProject();
}
