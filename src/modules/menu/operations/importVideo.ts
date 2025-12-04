import { debug } from '@tauri-apps/plugin-log';
import { projectActions } from '../../../persistence/stores/project/actions';
import { selectVideoFile } from './selectVideoFile';

export async function importVideo() {
	debug('Import video action triggered');

	const path = await selectVideoFile();

	if (path) {
		debug(`Selected video path: ${path}`);
		await projectActions.setVideoPath(path);
	} else {
		debug('No video path selected');
	}
}
