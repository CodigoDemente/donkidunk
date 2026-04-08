import { invoke } from '@tauri-apps/api/core';

export async function exportMetricsCSV(outPath: string): Promise<void> {
	return await invoke<void>('export_metrics_csv', {
		outPath
	});
}
