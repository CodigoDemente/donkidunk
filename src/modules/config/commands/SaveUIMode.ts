import { invoke } from '@tauri-apps/api/core';
import type { UIMode } from '../types/Config';

export async function saveUIModeCommand(uiMode: UIMode): Promise<void> {
	await invoke<void>('save_ui_mode', {
		uiMode: uiMode
	});
}
