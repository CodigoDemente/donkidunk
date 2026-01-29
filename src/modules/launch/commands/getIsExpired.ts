import { invoke } from '@tauri-apps/api/core';

export async function getIsExpiredCommand(): Promise<boolean> {
	const response = await invoke<boolean>('get_is_expired');

	return response;
}
