import { invoke } from '@tauri-apps/api/core';
import type { ButtonBoard } from '../../config/types/ButtonBoard';

export async function createEmptyBoardCommand(board: ButtonBoard): Promise<string> {
	const response = await invoke<string>('save_button_board', {
		boardId: board.id,
		boardContent: '{}'
	});

	return response;
}
