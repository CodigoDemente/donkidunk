import { invoke } from '@tauri-apps/api/core';
import type { BoardData } from '../../board/types/Board';

export async function saveButtonBoardCommand(
	boardId: string,
	boardName: string,
	isDefault: boolean,
	board: BoardData
): Promise<string> {
	return await invoke<string>('save_button_board', {
		boardId: boardId,
		boardName: boardName,
		isDefault: isDefault,
		boardContent: JSON.stringify(board)
	});
}
