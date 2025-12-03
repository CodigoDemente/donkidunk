import { Channel, invoke } from '@tauri-apps/api/core';
import type { ExportEvent } from '../../../events/types/ExportEvent';

export async function cutVideo(
	videoPath: string,
	outPath: string,
	ranges: [number, number][],
	onEvent: Channel<ExportEvent>
): Promise<void> {
	return await invoke<void>('cut_video', {
		videoPath,
		outPath,
		ranges,
		onEvent
	});
}
