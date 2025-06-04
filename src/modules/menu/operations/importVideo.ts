import { open } from '@tauri-apps/plugin-dialog';
import ProjectStore from '../../../persistence/stores/project/store.svelte';
import { enableSaveProject } from './enableItems';
import { debug } from '@tauri-apps/plugin-log';

export async function importVideo() {
	debug('Import video action triggered');

	const path = await open({
		directory: false,
		multiple: false,
		filters: [
			{
				name: 'Video files',
				extensions: ['mp4']
			}
		]
	});

	if (path) {
		debug(`Selected video path: ${path}`);
		ProjectStore.video.path = path;
	} else {
		debug('No video path selected');
	}

	await enableSaveProject();
}
