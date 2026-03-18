import { Context } from 'runed';
import { CategoryType } from '../board/types/CategoryType';
import type { ExportingRule, GalleryClip } from './types';
import { Channel } from '@tauri-apps/api/core';
import { projectActions } from '../../persistence/stores/project/actions';
import { path } from '@tauri-apps/api';
import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
import { save } from '@tauri-apps/plugin-dialog';
import { debug, error } from '@tauri-apps/plugin-log';
import type { ExportEvent } from '../../events/types/ExportEvent';
import { cutVideo } from './commands/CutVideo';
import { feedbackMessages } from '../../utils/messages';

const initialRule: ExportingRule = {
	type: CategoryType.Event,
	include: '',
	taggedWith: [],
	temp: true
};

export const exportContext = new Context<Exporting>('');

export class Exporting {
	#rules = $state<ExportingRule[]>([]);
	#loading = $state(false);
	#galleryClips = $state<GalleryClip[]>([]);
	#exportProgress = $state(0);
	#newRule = $state<ExportingRule>({ ...initialRule });

	setExportProgress(exportProgress: number) {
		this.#exportProgress = exportProgress;
	}

	resetState() {
		this.#rules = [];
		this.#galleryClips = [];
		this.#loading = false;
		this.#exportProgress = 0;
		this.#newRule = { ...initialRule };
	}

	// region Rule actions

	addRule() {
		if (this.#newRule.include) {
			this.#rules = [...this.#rules, { ...this.#newRule, temp: false }];
			this.#newRule = { ...initialRule };
		}
	}

	deleteRule(idx: number) {
		this.#rules = this.#rules.filter((_, i) => i !== idx);
	}

	moveRuleUp(idx: number) {
		if (idx <= 0) return;
		const rules = [...this.#rules];
		[rules[idx - 1], rules[idx]] = [rules[idx], rules[idx - 1]];
		this.#rules = rules;
	}

	moveRuleDown(idx: number) {
		if (idx >= this.#rules.length - 1) return;
		const rules = [...this.#rules];
		[rules[idx], rules[idx + 1]] = [rules[idx + 1], rules[idx]];
		this.#rules = rules;
	}

	async getGalleryClips() {
		const timelineRepository = TimelineRepositoryFactory.getInstance();
		this.#loading = true;
		try {
			const clips = await timelineRepository.getClipsForGallery(this.#rules);
			this.#galleryClips = clips;
		} catch (err) {
			error(`Failed to get gallery clips: ${err}`);
		} finally {
			this.#loading = false;
		}
	}

	async exportVideo(videoPath: string): Promise<void> {
		if (this.#loading) {
			return;
		}
		this.setExportProgress(0);

		const inVideoFolder = await path.dirname(videoPath);

		const outPath = await save({
			title: 'Select output video file',
			defaultPath: inVideoFolder,
			filters: [{ name: 'Video', extensions: ['mp4'] }]
		});

		if (!outPath) {
			return;
		}

		this.#loading = true;
		const timestampsForCut = this.#galleryClips.map((r) => r.timestamps);

		const onEvent = new Channel<ExportEvent>();
		onEvent.onmessage = (message: ExportEvent) => {
			const progress = message.progress;
			debug(`Exporting progress: ${message.progress}`);
			this.setExportProgress(Math.trunc(progress * 100));
		};

		try {
			await cutVideo(videoPath, outPath, timestampsForCut, onEvent);
			projectActions.setSnackbar(feedbackMessages.EXPORT_SUCCESS);
		} catch (err) {
			error(`Export failed: ${err}`);
			projectActions.setSnackbar(feedbackMessages.EXPORT_ERROR);
		} finally {
			this.#loading = false;
		}
	}

	/* Selectors */
	get rules() {
		return this.#rules;
	}

	get galleryClips() {
		return this.#galleryClips;
	}

	get loading() {
		return this.#loading;
	}

	get exportProgress() {
		return this.#exportProgress;
	}

	get newRule() {
		return this.#newRule;
	}
}
