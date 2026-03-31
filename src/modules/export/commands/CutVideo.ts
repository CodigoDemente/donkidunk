import { Channel, invoke } from '@tauri-apps/api/core';
import type { ExportEvent } from '../../../events/types/ExportEvent';
import { SubscriptionInactive } from '$lib/errors/subscriptionErrors';

export async function cutVideo(
	videoPath: string,
	outPath: string,
	ranges: [number, number][],
	onEvent: Channel<ExportEvent>
): Promise<void> {
	try {
		await invoke<void>('cut_video', {
			videoPath,
			outPath,
			ranges,
			onEvent
		});
	} catch (err) {
		if (typeof err === 'string' && err.toLowerCase().includes('subscription inactive')) {
			throw new SubscriptionInactive();
		} else {
			throw err;
		}
	}
}
