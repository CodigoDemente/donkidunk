import { invoke } from '@tauri-apps/api/core';

export async function saveBoardSizeCommand(eventSize: number, tagSize: number): Promise<void> {
	if (Math.abs(eventSize + tagSize - 100) > Number.EPSILON) {
		throw new Error('Event size and tag size must add up to 100');
	}

	const roundedEventSize = Math.round(eventSize);
	const roundedTagSize = 100 - roundedEventSize;

	return await invoke<void>('save_board_size', {
		eventSize: roundedEventSize,
		tagSize: roundedTagSize
	});
}
