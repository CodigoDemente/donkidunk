import { invoke } from '@tauri-apps/api/core';

export async function ensureActiveLicense() {
	return await invoke<void>('ensure_active_license');
}
