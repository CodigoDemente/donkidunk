import { invoke } from '@tauri-apps/api/core';

export async function logoutCommand(): Promise<void> {
	await invoke('logout');
}
