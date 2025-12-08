import type { Board } from '../../board/context.svelte';
import { saveButtonBoardCommand } from '../../config/commands/SaveButtonBoard';
import { v7 as uuidv7 } from 'uuid';
import { Config } from '../../config/context.svelte';

export async function saveButtonBoard(board: Board, config: Config) {
	const currentBoard = board.getState();

	const newBoardData = config.newButtonBoardFormData;

	if (!newBoardData) {
		return;
	}

	const newBoardId = uuidv7();

	const path = await saveButtonBoardCommand(
		newBoardId,
		newBoardData.boardName,
		newBoardData.isDefault,
		currentBoard
	);

	config.buttonBoards.push({
		path,
		id: newBoardId,
		name: newBoardData.boardName,
		isDefault: newBoardData.isDefault
	});
}
