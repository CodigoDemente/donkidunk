import { invoke } from '@tauri-apps/api/core';

export async function isAuthenticated(): Promise<boolean> {
	return await invoke<boolean>('is_authenticated');
}
