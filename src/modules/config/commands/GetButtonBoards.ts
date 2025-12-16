import { invoke } from '@tauri-apps/api/core';
import type { ButtonBoard } from '../types/ButtonBoard';
import type { BackendButtonBoard } from '../types/BackendButtonBoard';
import { ButtonBoardMapper } from '../mappers/ButtonBoardMapper';

export async function getButtonBoardsCommand(): Promise<ButtonBoard[]> {
	const response = await invoke<BackendButtonBoard[]>('get_button_boards');

	return response.map(ButtonBoardMapper.toDomain);
}
