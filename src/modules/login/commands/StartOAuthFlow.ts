import { invoke } from '@tauri-apps/api/core';

export async function startOAuthFlow(): Promise<string> {
	return await invoke<string>('start_oauth_flow');
}
