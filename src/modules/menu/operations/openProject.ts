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
import { enableCloseProject, enableImportVideo } from './enableItems';
import { ProjectRepositoryFactory } from '../../../factories/ProjectRepositoryFactory';
import ProjectStore from '../../../persistence/stores/project/store.svelte';
import { projectActions } from '../../../persistence/stores/project/actions';
import { BoardRepositoryFactory } from '../../../factories/BoardRepositoryFactory';
import { TimelineRepositoryFactory } from '../../../factories/TimelineRepositoryFactory';
import type { Board } from '../../board/context.svelte';
import type { Timeline } from '../../videoplayer/context.svelte';
import type { Config } from '../../config/context.svelte';
import { UIMode } from '../../config/types/Config';
import { closeProject } from './closeProject';

export async function openProject(board: Board, timeline: Timeline, config: Config) {
	debug('Open project action triggered');

	if (projectActions.getDatabase()) {
		await closeProject(board, timeline);
	}

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

	const projectStore = ProjectStore.getState();

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

	const projectLoaded = await loadProjectFromDatabase(ProjectRepositoryFactory.getInstance());

	if (!projectLoaded) {
		debug('Project not loaded because the video file was not found');

		await closeProject(board, timeline);

		return;
	}

	await loadBoardFromDatabase(BoardRepositoryFactory.getInstance(), board);
	await loadTimelineFromDatabase(TimelineRepositoryFactory.getInstance(), timeline);

	if (board.tagCategories.length) {
		config.uiMode = UIMode.Advanced;
	}

	await enableImportVideo();
	await enableCloseProject();
}
