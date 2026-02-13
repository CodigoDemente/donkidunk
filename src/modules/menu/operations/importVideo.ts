import { debug } from '@tauri-apps/plugin-log';
import { projectActions } from '../../../persistence/stores/project/actions';
import { selectVideoFile } from './selectVideoFile';
import type { Timeline } from '../../videoplayer/context.svelte';
import ImportVideoModal from '../../modalContent/importVideoModal/index.svelte';

export async function importVideo(timeline: Timeline) {
	debug('Import video action triggered');

	const path = await selectVideoFile();

	if (!path) {
		debug('No video path selected');
		return;
	}

	debug(`Selected video path: ${path}`);

	if (timeline.hasEvents()) {
		const confirmed = await requestImportConfirmation();

		if (!confirmed) {
			return;
		}

		await timeline.clearAllEvents();
	}

	await projectActions.setVideoPath(path);
}

function requestImportConfirmation(): Promise<boolean> {
	return new Promise((resolve) => {
		projectActions.setModal({
			content: ImportVideoModal,
			title: 'Import Video',
			onCancel: () => {
				projectActions.closeAndResetModal();
				resolve(false);
			},
			onSubmit: () => {
				projectActions.closeAndResetModal();
				resolve(true);
			},
			onSubmitText: 'Continue',
			show: true,
			size: 'medium'
		});
	});
}
