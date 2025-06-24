import { ask, open } from '@tauri-apps/plugin-dialog';
import { debug } from '@tauri-apps/plugin-log';
import {
	backupDatabase,
	checkBackupExistence,
	closeDatabase,
	loadProjectFromDatabase,
	openDatabase,
	restoreBackup
} from '../../../persistence/database/actions';
import { enableImportVideo } from './enableItems';
import { ProjectRepositoryFactory } from '../../../factories/ProjectRepositoryFactory';
import ProjectStore from '../../../persistence/stores/project/store.svelte';
import { setFilePath } from '../../../persistence/stores/project/actions';

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

		setFilePath(path);
		await openDatabase(path);
	} else {
		debug('No path selected');
		return;
	}

	const backupId = await ProjectRepositoryFactory.getInstance().getBackupId();

	// Use the store directly instead of the actions to avoid writing it again to the database
	ProjectStore.metadata.backupId = backupId;

	const backupExists = await checkBackupExistence(backupId);
	let backupRestored = false;

	if (backupExists) {
		const answer = await ask(
			'There is a more recent version of your project saved as backup. Do you want to restore it?',
			{
				title: 'Restore project',
				okLabel: 'Yes',
				cancelLabel: 'No'
			}
		);

		if (answer) {
			await restoreBackup(backupId!);

			backupRestored = true;

			debug('Project restored from backup');
		}
	}

	if (!backupRestored) {
		const backupPath = await backupDatabase(backupId!);

		await closeDatabase();

		setFilePath(path);

		await openDatabase(backupPath, true);
	}

	await loadProjectFromDatabase(ProjectRepositoryFactory.getInstance());

	await enableImportVideo();
}
