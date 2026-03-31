import { debug } from '@tauri-apps/plugin-log';
import { v7 as uuidv7 } from 'uuid';
import { createBackupDatabase } from '../../../persistence/database/actions';
import { projectActions } from '../../../persistence/stores/project/actions';
import type { ButtonBoard } from '../../config/types/ButtonBoard';
import {
	enableCloseProject,
	enableImportVideo,
	enableSaveButtonBoard
} from '../../menu/operations/enableItems';
import { selectProjectPath } from '../../menu/operations/selectProjectPath';
import { readFile } from '@tauri-apps/plugin-fs';
import type { BoardData } from '../../board/types/Board';
import type { Board } from '../../board/context.svelte';
import type { Config } from '../../config/context.svelte';
import { UIMode } from '../../config/types/Config';
import { closeProject } from '../../menu/operations/closeProject';
import type { Timeline } from '../../videoplayer/context.svelte';
import { saveUIModeCommand } from '../../config/commands/SaveUIMode';

export async function createNewProject(
	board: Board,
	timeline: Timeline,
	config: Config,
	buttonBoard?: ButtonBoard,
	providedPath?: string
) {
	debug('New project action triggered');

	let path = providedPath;

	if (!path) {
		const selectedPath = await selectProjectPath();

		if (!selectedPath) {
			debug('No path selected');
			return;
		}

		path = selectedPath;
	}

	if (path && !path.endsWith('.dnk')) {
		path = `${path}.dnk`;
	}

	if (!path) {
		debug('No valid path available');
		return;
	}

	if (projectActions.getDatabase()) {
		await closeProject(board, timeline);
	}

	projectActions.setFilePath(path);

	const backupId = uuidv7();

	await createBackupDatabase(backupId);

	await projectActions.setLastSavedTimestamp(new Date().toISOString());

	if (buttonBoard?.id) {
		debug('Loading button board');
		await loadButtonBoardIntoProject(buttonBoard, board);

		if (board.tagCategories.length) {
			config.uiMode = UIMode.Advanced;
		} else {
			config.uiMode = UIMode.Simple;
		}

		await saveUIModeCommand(config.uiMode);
	}

	await enableImportVideo();
	await enableCloseProject();
	await enableSaveButtonBoard();
}

async function loadButtonBoardIntoProject(buttonBoard: ButtonBoard, board: Board) {
	const boardContent = await readFile(buttonBoard.path);

	const boardData = JSON.parse(new TextDecoder().decode(boardContent)) as BoardData;

	await board.loadBoard(boardData);
}
