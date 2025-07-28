import { ask, open } from '@tauri-apps/plugin-dialog';
import { debug } from '@tauri-apps/plugin-log';
import {
	backupDatabase,
	checkBackupExistence,
	closeDatabase,
	loadBoardFromDatabase,
	loadProjectFromDatabase,
	loadTimelineFromDatabase,
	openDatabase,
	restoreBackup
} from '../../../persistence/database/actions';
import { enableImportVideo } from './enableItems';
import { ProjectRepositoryFactory } from '../../../factories/ProjectRepositoryFactory';
import ProjectStore from '../../../persistence/stores/project/store.svelte';
import { projectActions } from '../../../persistence/stores/project/actions';
import { BoardRepositoryFactory } from '../../../factories/BoardRepositoryFactory';
import { TimelineRepositoryFactory } from '../../../factories/TimelineRepositoryFactory';

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

		projectActions.setFilePath(path);
		await openDatabase(path);
	} else {
		debug('No path selected');
		return;
	}

	const backupId = await ProjectRepositoryFactory.getInstance().getBackupId();

	const projectStore = ProjectStore.state;

	// Use the store directly instead of the actions to avoid writing it again to the database
	projectStore.metadata.backupId = backupId;

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

		projectActions.setFilePath(path);

		await openDatabase(backupPath, true);
	}

	await loadProjectFromDatabase(ProjectRepositoryFactory.getInstance());
	await loadBoardFromDatabase(BoardRepositoryFactory.getInstance());
	await loadTimelineFromDatabase(TimelineRepositoryFactory.getInstance());

	await enableImportVideo();
}
