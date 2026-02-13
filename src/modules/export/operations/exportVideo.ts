import { Channel } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { path } from '@tauri-apps/api';
import { debug } from '@tauri-apps/plugin-log';
import type { ExportEvent } from '../../../events/types/ExportEvent';
import type { ExportingRule } from '../types';
import type { TimelineRepository } from '../../../ports/TimelineRepository';
import { cutVideo } from '../commands/CutVideo';
import { exportActions } from '../../../persistence/stores/export/actions';

export async function exportVideo(
	videoPath: string,
	rules: ExportingRule[],
	timelineRepository: TimelineRepository
): Promise<void> {
	exportActions.setExporting(false);
	exportActions.setExportProgress(0);

	const inVideoFolder = await path.dirname(videoPath);

	const outPath = await save({
		title: 'Select output video file',
		defaultPath: inVideoFolder,
		filters: [{ name: 'Video', extensions: ['mp4'] }]
	});

	if (!outPath) {
		return;
	}

	exportActions.setExporting(true);

	const ranges = await timelineRepository.getRangesForExport(rules);

	const onEvent = new Channel<ExportEvent>();
	onEvent.onmessage = (message) => {
		const progress = message.progress;
		debug(`Exporting progress: ${message.progress}`);
		exportActions.setExportProgress(Math.trunc(progress * 100));
	};

	await cutVideo(videoPath, outPath, ranges, onEvent);

	exportActions.setExporting(false);
}
