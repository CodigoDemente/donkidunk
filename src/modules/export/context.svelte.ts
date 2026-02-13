import { SvelteSet } from 'svelte/reactivity';
import { CategoryType } from '../../components/box/types';
import type { ExportingRule } from './types';
import type { Board } from '../board/context.svelte';
import type { Timeline } from '../videoplayer/context.svelte';

const initialRule: ExportingRule = {
	type: CategoryType.Event,
	include: '',
	taggedWith: [],
	temp: true
};

export class ExportContext {
	#board: Board;
	#timeline: Timeline;

	rules = $state<ExportingRule[]>([]);
	newRule = $state<ExportingRule>({ ...initialRule });

	constructor(board: Board, timeline: Timeline) {
		this.#board = board;
		this.#timeline = timeline;
	}

	// region Derived

	get allEventOptions() {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const buttonIdsWithEvents = new Set(
			this.#timeline.getState().eventTimeline.map((event) => event.buttonId)
		);

		return Object.values(this.#board.eventButtonsById)
			.filter((button) => buttonIdsWithEvents.has(button.id))
			.map((button) => ({
				value: button.id,
				label: button.name
			}));
	}

	get allTags() {
		return Object.values(this.#board.tagsById).map((tag) => ({
			id: tag.id,
			value: tag.id,
			label: tag.name,
			color: tag.color
		}));
	}

	get availableTags() {
		if (!this.newRule.include) {
			return [];
		}

		const eventsWithButtonId = this.#timeline
			.getState()
			.eventTimeline.filter((event) => event.buttonId === this.newRule.include);

		const tagIds = new SvelteSet<string>();
		eventsWithButtonId.forEach((event) => {
			event.tagsRelated.forEach((tagId) => tagIds.add(tagId));
		});

		return this.allTags.filter((tag) => tagIds.has(tag.value));
	}

	// region Rule actions

	addRule() {
		if (this.newRule.include) {
			this.rules = [...this.rules, { ...this.newRule, temp: false }];
			this.newRule = { ...initialRule };
		}
	}

	deleteRule(idx: number) {
		this.rules = this.rules.filter((_, i) => i !== idx);
	}

	moveRuleUp(idx: number) {
		if (idx <= 0) return;
		const rules = [...this.rules];
		[rules[idx - 1], rules[idx]] = [rules[idx], rules[idx - 1]];
		this.rules = rules;
	}

	moveRuleDown(idx: number) {
		if (idx >= this.rules.length - 1) return;
		const rules = [...this.rules];
		[rules[idx], rules[idx + 1]] = [rules[idx + 1], rules[idx]];
		this.rules = rules;
	}

	// region Helpers

	getEventLabel(eventId: string): string {
		return this.#board.eventButtonsById[eventId]?.name || eventId;
	}

	getTagById(tagId: string) {
		return this.#board.tagsById[tagId];
	}
}
