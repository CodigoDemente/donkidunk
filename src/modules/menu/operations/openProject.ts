import { ask, open } from '@tauri-apps/plugin-dialog';
import { debug } from '@tauri-apps/plugin-log';
import { loadProjectFromDatabase, openDatabase } from '../../../persistence/database/index.svelte';
import ProjectStore from '../../../persistence/stores/project/store.svelte';
import filePersistenceStore from '../../../persistence/file/index.svelte';
import type { ProjectData } from '../../../persistence/stores/project/types/Project';
import { enableImportVideo } from './enableItems';
import { StoreScope } from '../../../persistence/stores';

export async function openProject() {
	debug('Open project action triggered');

	const path = await open({
		directory: false,
		multiple: false,
		filters: [
			{
				name: 'Donkidunk project file',
				extensions: ['dnk']
			}
		]
	});

	if (path) {
		debug(`Selected path: ${path}`);

		await openDatabase(path, false);

		ProjectStore.file.newlyCreated = false;
	} else {
		debug('No path selected');
	}

	const savedData = await filePersistenceStore.load<ProjectData>(StoreScope.PROJECT);

	const savedTimestamp = savedData?.metadata?.timestamp;

	await loadProjectFromDatabase();

	filePersistenceStore.enableAutoSave();

	if (
		savedTimestamp &&
		new Date(ProjectStore.metadata.timestamp).getTime() < new Date(savedTimestamp).getTime()
	) {
		const answer = await ask(
			'There is a more recent version of your project saved as backup. Do you want to restore it?',
			{
				title: 'Restore project',
				okLabel: 'Yes',
				cancelLabel: 'No'
			}
		);

		if (answer) {
			ProjectStore.metadata.timestamp = savedTimestamp;
			ProjectStore.video.path = savedData?.video?.path || '';

			debug('Project restored from backup');
		}
	}

	await enableImportVideo();
}
