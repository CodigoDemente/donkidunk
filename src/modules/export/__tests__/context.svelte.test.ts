/**
 * Tests for the ExportContext class (context.svelte.ts).
 *
 * These run in a real browser via vitest-browser-svelte because the class
 * uses Svelte 5 runes ($state) which require the Svelte runtime.
 *
 * Board and Timeline dependencies are mocked as plain objects.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { CategoryType } from '../../board/types/CategoryType';
import type { Board } from '../../board/context.svelte';
import type { Timeline } from '../../videoplayer/context.svelte';
import type { RangeDataWithTags } from '../../videoplayer/types/RangeData';
import type { Button } from '../../board/types/Button';
import type { Tag } from '../../board/types/Tag';

// ─── Test helpers ────────────────────────────────────────────────────────────

const { ExportContext } = await import('../context.svelte');

function createEvent(overrides: Partial<RangeDataWithTags> = {}): RangeDataWithTags {
	return {
		id: 'evt-1',
		buttonId: 'btn-1',
		categoryId: 'cat-1',
		timestamp: { start: 0, end: 10 },
		tagsRelated: [],
		...overrides
	};
}

function createButton(overrides: Partial<Button> = {}): Button {
	return {
		id: 'btn-1',
		name: 'Action',
		color: '#3b82f6',
		duration: null,
		before: null,
		...overrides
	};
}

function createTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: 'tag-1',
		name: 'Important',
		color: '#ef4444',
		...overrides
	};
}

function createMockBoard(
	eventButtonsById: Record<string, Button> = {},
	tagsById: Record<string, Tag> = {}
): Board {
	return {
		eventButtonsById,
		tagsById
	} as unknown as Board;
}

function createMockTimeline(events: RangeDataWithTags[] = []): Timeline {
	return {
		getState: () => ({
			eventTimeline: events
		})
	} as unknown as Timeline;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExportContext', () => {
	let board: Board;
	let timeline: Timeline;
	let ctx: InstanceType<typeof ExportContext>;
	let cleanup: () => void;

	beforeEach(() => {
		board = createMockBoard();
		timeline = createMockTimeline();
		cleanup = $effect.root(() => {
			ctx = new ExportContext(board, timeline);
		});
	});

	afterEach(() => {
		cleanup();
	});

	// ── Initial state ────────────────────────────────────────────────────────

	describe('Initial State', () => {
		it('should start with empty rules', () => {
			expect(ctx.rules).toEqual([]);
		});

		it('should start with a default newRule', () => {
			expect(ctx.newRule).toEqual({
				type: CategoryType.Event,
				include: '',
				taggedWith: [],
				temp: true
			});
		});
	});

	// ── allEventOptions ──────────────────────────────────────────────────────

	describe('allEventOptions', () => {
		it('should return empty when no events exist', () => {
			board = createMockBoard({ 'btn-1': createButton() });
			timeline = createMockTimeline([]);
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			expect(ctx.allEventOptions).toEqual([]);
		});

		it('should return only buttons that have events in the timeline', () => {
			const btn1 = createButton({ id: 'btn-1', name: 'Action A' });
			const btn2 = createButton({ id: 'btn-2', name: 'Action B' });
			const btn3 = createButton({ id: 'btn-3', name: 'Unused' });

			board = createMockBoard({
				'btn-1': btn1,
				'btn-2': btn2,
				'btn-3': btn3
			});
			timeline = createMockTimeline([
				createEvent({ id: 'e1', buttonId: 'btn-1' }),
				createEvent({ id: 'e2', buttonId: 'btn-2' }),
				createEvent({ id: 'e3', buttonId: 'btn-1' }) // duplicate button
			]);
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			const options = ctx.allEventOptions;
			expect(options).toHaveLength(2);
			expect(options).toContainEqual({ value: 'btn-1', label: 'Action A' });
			expect(options).toContainEqual({ value: 'btn-2', label: 'Action B' });
		});

		it('should not include buttons not in eventButtonsById', () => {
			board = createMockBoard({}); // no buttons registered
			timeline = createMockTimeline([createEvent({ buttonId: 'orphan-btn' })]);
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			expect(ctx.allEventOptions).toEqual([]);
		});
	});

	// ── allTags ──────────────────────────────────────────────────────────────

	describe('allTags', () => {
		it('should return empty when no tags exist', () => {
			expect(ctx.allTags).toEqual([]);
		});

		it('should return all tags from board', () => {
			const tag1 = createTag({ id: 'tag-1', name: 'Urgent', color: '#ff0000' });
			const tag2 = createTag({ id: 'tag-2', name: 'Review', color: '#00ff00' });

			board = createMockBoard({}, { 'tag-1': tag1, 'tag-2': tag2 });
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			const tags = ctx.allTags;
			expect(tags).toHaveLength(2);
			expect(tags).toContainEqual({
				id: 'tag-1',
				value: 'tag-1',
				label: 'Urgent',
				color: '#ff0000'
			});
			expect(tags).toContainEqual({
				id: 'tag-2',
				value: 'tag-2',
				label: 'Review',
				color: '#00ff00'
			});
		});
	});

	// ── availableTags ────────────────────────────────────────────────────────

	describe('availableTags', () => {
		it('should return empty when newRule.include is empty', () => {
			expect(ctx.availableTags).toEqual([]);
		});

		it('should return tags related to events matching the selected button', () => {
			const tag1 = createTag({ id: 'tag-1', name: 'Important' });
			const tag2 = createTag({ id: 'tag-2', name: 'Other' });

			board = createMockBoard(
				{ 'btn-1': createButton({ id: 'btn-1' }) },
				{ 'tag-1': tag1, 'tag-2': tag2 }
			);
			timeline = createMockTimeline([
				createEvent({ id: 'e1', buttonId: 'btn-1', tagsRelated: ['tag-1'] }),
				createEvent({ id: 'e2', buttonId: 'btn-2', tagsRelated: ['tag-2'] })
			]);
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			ctx.newRule.include = 'btn-1';

			expect(ctx.availableTags).toHaveLength(1);
			expect(ctx.availableTags[0].value).toBe('tag-1');
		});

		it('should return unique tags even if multiple events reference the same tag', () => {
			const tag1 = createTag({ id: 'tag-1', name: 'Shared' });

			board = createMockBoard({ 'btn-1': createButton({ id: 'btn-1' }) }, { 'tag-1': tag1 });
			timeline = createMockTimeline([
				createEvent({ id: 'e1', buttonId: 'btn-1', tagsRelated: ['tag-1'] }),
				createEvent({ id: 'e2', buttonId: 'btn-1', tagsRelated: ['tag-1'] })
			]);
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			ctx.newRule.include = 'btn-1';

			expect(ctx.availableTags).toHaveLength(1);
		});

		it('should return empty when selected button has no events', () => {
			board = createMockBoard(
				{ 'btn-1': createButton({ id: 'btn-1' }) },
				{ 'tag-1': createTag({ id: 'tag-1' }) }
			);
			timeline = createMockTimeline([]);
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			ctx.newRule.include = 'btn-1';

			expect(ctx.availableTags).toEqual([]);
		});
	});

	// ── addRule ──────────────────────────────────────────────────────────────

	describe('addRule', () => {
		it('should add a rule when include is set', () => {
			ctx.newRule.include = 'btn-1';
			ctx.newRule.taggedWith = ['tag-1'];

			ctx.addRule();

			expect(ctx.rules).toHaveLength(1);
			expect(ctx.rules[0]).toEqual({
				type: CategoryType.Event,
				include: 'btn-1',
				taggedWith: ['tag-1'],
				temp: false
			});
		});

		it('should not add a rule when include is empty', () => {
			ctx.newRule.include = '';

			ctx.addRule();

			expect(ctx.rules).toHaveLength(0);
		});

		it('should reset newRule after adding', () => {
			ctx.newRule.include = 'btn-1';

			ctx.addRule();

			expect(ctx.newRule).toEqual({
				type: CategoryType.Event,
				include: '',
				taggedWith: [],
				temp: true
			});
		});

		it('should add multiple rules sequentially', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();

			ctx.newRule.include = 'btn-2';
			ctx.addRule();

			expect(ctx.rules).toHaveLength(2);
			expect(ctx.rules[0].include).toBe('btn-1');
			expect(ctx.rules[1].include).toBe('btn-2');
		});

		it('should mark added rules as not temp', () => {
			ctx.newRule.include = 'btn-1';

			ctx.addRule();

			expect(ctx.rules[0].temp).toBe(false);
		});
	});

	// ── deleteRule ──────────────────────────────────────────────────────────

	describe('deleteRule', () => {
		it('should remove a rule at the given index', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();
			ctx.newRule.include = 'btn-2';
			ctx.addRule();
			ctx.newRule.include = 'btn-3';
			ctx.addRule();

			ctx.deleteRule(1);

			expect(ctx.rules).toHaveLength(2);
			expect(ctx.rules[0].include).toBe('btn-1');
			expect(ctx.rules[1].include).toBe('btn-3');
		});

		it('should handle deleting the first rule', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();
			ctx.newRule.include = 'btn-2';
			ctx.addRule();

			ctx.deleteRule(0);

			expect(ctx.rules).toHaveLength(1);
			expect(ctx.rules[0].include).toBe('btn-2');
		});

		it('should handle deleting the last rule', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();

			ctx.deleteRule(0);

			expect(ctx.rules).toHaveLength(0);
		});
	});

	// ── moveRuleUp ──────────────────────────────────────────────────────────

	describe('moveRuleUp', () => {
		it('should swap a rule with the one above it', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();
			ctx.newRule.include = 'btn-2';
			ctx.addRule();
			ctx.newRule.include = 'btn-3';
			ctx.addRule();

			ctx.moveRuleUp(2);

			expect(ctx.rules[0].include).toBe('btn-1');
			expect(ctx.rules[1].include).toBe('btn-3');
			expect(ctx.rules[2].include).toBe('btn-2');
		});

		it('should do nothing when index is 0', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();
			ctx.newRule.include = 'btn-2';
			ctx.addRule();

			ctx.moveRuleUp(0);

			expect(ctx.rules[0].include).toBe('btn-1');
			expect(ctx.rules[1].include).toBe('btn-2');
		});

		it('should do nothing when index is negative', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();

			ctx.moveRuleUp(-1);

			expect(ctx.rules[0].include).toBe('btn-1');
		});
	});

	// ── moveRuleDown ────────────────────────────────────────────────────────

	describe('moveRuleDown', () => {
		it('should swap a rule with the one below it', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();
			ctx.newRule.include = 'btn-2';
			ctx.addRule();
			ctx.newRule.include = 'btn-3';
			ctx.addRule();

			ctx.moveRuleDown(0);

			expect(ctx.rules[0].include).toBe('btn-2');
			expect(ctx.rules[1].include).toBe('btn-1');
			expect(ctx.rules[2].include).toBe('btn-3');
		});

		it('should do nothing when index is the last', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();
			ctx.newRule.include = 'btn-2';
			ctx.addRule();

			ctx.moveRuleDown(1);

			expect(ctx.rules[0].include).toBe('btn-1');
			expect(ctx.rules[1].include).toBe('btn-2');
		});

		it('should do nothing when rules list has one element', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();

			ctx.moveRuleDown(0);

			expect(ctx.rules[0].include).toBe('btn-1');
		});
	});

	// ── getEventLabel ────────────────────────────────────────────────────────

	describe('getEventLabel', () => {
		it('should return the button name for a known event', () => {
			board = createMockBoard({
				'btn-1': createButton({ id: 'btn-1', name: 'Sprint' })
			});
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			expect(ctx.getEventLabel('btn-1')).toBe('Sprint');
		});

		it('should return the eventId when button is not found', () => {
			board = createMockBoard({});
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			expect(ctx.getEventLabel('unknown-btn')).toBe('unknown-btn');
		});
	});

	// ── getTagById ──────────────────────────────────────────────────────────

	describe('getTagById', () => {
		it('should return the tag for a known tagId', () => {
			const tag = createTag({ id: 'tag-1', name: 'Goal', color: '#00ff00' });
			board = createMockBoard({}, { 'tag-1': tag });
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			const result = ctx.getTagById('tag-1');
			expect(result).toBeDefined();
			expect(result.name).toBe('Goal');
		});

		it('should return undefined for an unknown tagId', () => {
			board = createMockBoard({}, {});
			cleanup();
			cleanup = $effect.root(() => {
				ctx = new ExportContext(board, timeline);
			});

			expect(ctx.getTagById('nonexistent')).toBeUndefined();
		});
	});
});
