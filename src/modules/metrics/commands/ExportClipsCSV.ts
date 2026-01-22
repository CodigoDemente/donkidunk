import { invoke } from '@tauri-apps/api/core';

export async function exportClipsCSV(outPath: string): Promise<void> {
	return await invoke<void>('export_clips_csv', {
		outPath
	});
}
