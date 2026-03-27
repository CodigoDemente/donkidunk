import { Context } from 'runed';
import { CategoryType } from '../board/types/CategoryType';
import type { Button } from '../board/types/Button';
import type { Tag } from '../board/types/Tag';
import { boardContext } from '../board/context.svelte';
import { timelineContext } from '../videoplayer/context.svelte';
import type { ExportingRule, ExportMode, GalleryClip } from './types';
import { Channel } from '@tauri-apps/api/core';
import { projectActions } from '../../persistence/stores/project/actions';
import { path } from '@tauri-apps/api';
import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
import { save } from '@tauri-apps/plugin-dialog';
import { debug, error } from '@tauri-apps/plugin-log';
import type { ExportEvent } from '../../events/types/ExportEvent';
import { cutVideo } from './commands/CutVideo';
import { feedbackMessages } from '../../utils/messages';
import { SvelteSet } from 'svelte/reactivity';

const initialRule: ExportingRule = {
	type: CategoryType.Event,
	include: '',
	taggedWith: [],
	temp: true
};

export const exportContext = new Context<Exporting>('');

export class Exporting {
	/* State */

	#rules = $state<ExportingRule[]>([]);
	#loading = $state(false);
	#galleryClips = $state<GalleryClip[]>([]);
	#clipsOrdered = $state<GalleryClip[]>([]);
	#exportProgress = $state(0);
	#newRule = $state<ExportingRule>({ ...initialRule });
	#exportMode = $state<ExportMode>('rule-order');

	/* Actions */

	resetState() {
		this.#rules = [];
		this.#galleryClips = [];
		this.#loading = false;
		this.#exportProgress = 0;
		this.#newRule = { ...initialRule };
		this.#exportMode = 'rule-order';
	}

	setExportMode(mode: ExportMode) {
		this.#exportMode = mode;
	}

	setExportProgress(exportProgress: number) {
		this.#exportProgress = exportProgress;
	}

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

	addClipToOrder(clip: GalleryClip) {
		this.#clipsOrdered = [...this.#clipsOrdered, clip];
	}

	removeClipFromOrder(idx: number) {
		this.#clipsOrdered = this.#clipsOrdered.filter((_, i) => i !== idx);
	}

	reorderClip(fromIdx: number, toIdx: number) {
		if (fromIdx === toIdx) return;
		const updated = [...this.#clipsOrdered];
		const [moved] = updated.splice(fromIdx, 1);
		updated.splice(toIdx, 0, moved);
		this.#clipsOrdered = updated;
	}

	/* Operations on Database */

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

	async exportVideo(videoPath: string, step: 1 | 2 = 1): Promise<void> {
		const timelineRepository = TimelineRepositoryFactory.getInstance();
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
		let clipsToCut: GalleryClip[] = [];
		if (step === 1) {
			clipsToCut = await timelineRepository.getClipsForGallery(this.#rules);
		} else {
			clipsToCut = this.#clipsOrdered;
		}
		const timestampsForCut = clipsToCut.map((r) => r.timestamps);

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

	get clipsOrdered() {
		return this.#clipsOrdered;
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

	get exportMode() {
		return this.#exportMode;
	}

	/**
	 * Event buttons that have at least one clip on the timeline (board + timeline intersection).
	 */
	get eventButtonsForRuleForm(): Button[] {
		const timeline = timelineContext.get();
		const board = boardContext.get();
		const eventButtonsById = board.eventButtonsById;
		const eventTimeline = timeline.eventTimeline;

		const seen = new SvelteSet<string>();
		const buttons: Button[] = [];

		for (const event of eventTimeline) {
			const id = event.buttonId;
			if (seen.has(id)) {
				continue;
			}
			seen.add(id);
			const btn = eventButtonsById[id];
			if (btn) {
				buttons.push(btn);
			}
		}

		return buttons.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
	}

	/**
	 * Tags used on timeline events for the currently selected button in the rule form.
	 */
	get tagsForSelectedButton(): Tag[] {
		const timeline = timelineContext.get();
		const board = boardContext.get();
		const selectedButtonId = this.#newRule.include;
		if (!selectedButtonId) {
			return [];
		}

		const eventTimeline = timeline.eventTimeline;
		const tagsById = board.tagsById;

		const seen = new SvelteSet<string>();
		const orderedIds: string[] = [];

		for (const event of eventTimeline) {
			if (event.buttonId !== selectedButtonId) {
				continue;
			}
			for (const tagId of event.tagsRelated) {
				if (!seen.has(tagId)) {
					seen.add(tagId);
					orderedIds.push(tagId);
				}
			}
		}

		return orderedIds.map((id) => tagsById[id]).filter((t): t is Tag => t != null);
	}
}
