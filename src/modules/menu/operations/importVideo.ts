import { open } from '@tauri-apps/plugin-dialog';
import { debug } from '@tauri-apps/plugin-log';
import { projectActions } from '../../../persistence/stores/project/actions';

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
		await projectActions.setVideoPath(path);
	} else {
		debug('No video path selected');
	}
}
