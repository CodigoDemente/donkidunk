/**
 * Tests for the Exporting class (context.svelte.ts).
 *
 * These run in a real browser via vitest-browser-svelte because the class
 * uses Svelte 5 runes ($state) which require the Svelte runtime.
 *
 * Board and Timeline contexts are mocked so no backend is needed.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CategoryType } from '../../board/types/CategoryType';
import type { RangeDataWithTags } from '../../videoplayer/types/RangeData';
import type { Button } from '../../board/types/Button';
import type { Tag } from '../../board/types/Tag';
import type { GalleryClip } from '../types';

// ─── Mocks ───────────────────────────────────────────────────────────────────

let mockEventButtonsById: Record<string, Button> = {};
let mockTagsById: Record<string, Tag> = {};
let mockEventTimeline: RangeDataWithTags[] = [];

vi.mock('../../board/context.svelte', () => ({
	boardContext: {
		get: () => ({
			eventButtonsById: mockEventButtonsById,
			tagsById: mockTagsById
		})
	}
}));

vi.mock('../../videoplayer/context.svelte', () => ({
	timelineContext: {
		get: () => ({
			eventTimeline: mockEventTimeline
		})
	}
}));

vi.mock('../../../factories/TimelineRepositoryFactory', () => ({
	TimelineRepositoryFactory: {
		getInstance: () => ({
			getClipsForGallery: vi.fn().mockResolvedValue([])
		})
	}
}));

vi.mock('@tauri-apps/plugin-log', () => ({
	debug: vi.fn(),
	error: vi.fn()
}));

// ─── Test helpers ────────────────────────────────────────────────────────────

const { Exporting } = await import('../context.svelte');

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

function createGalleryClip(overrides: Partial<GalleryClip> = {}): GalleryClip {
	return {
		index: 0,
		timestamps: [10, 20],
		buttonId: 'btn-1',
		buttonName: 'Action',
		buttonColor: '#3b82f6',
		categoryName: 'Events',
		tags: [],
		...overrides
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Exporting', () => {
	let ctx: InstanceType<typeof Exporting>;
	let cleanup: () => void;

	beforeEach(() => {
		mockEventButtonsById = {};
		mockTagsById = {};
		mockEventTimeline = [];
		cleanup = $effect.root(() => {
			ctx = new Exporting();
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

		it('should start with empty galleryClips', () => {
			expect(ctx.galleryClips).toEqual([]);
		});

		it('should start with empty clipsOrdered', () => {
			expect(ctx.clipsOrdered).toEqual([]);
		});

		it('should start with loading false', () => {
			expect(ctx.loading).toBe(false);
		});

		it('should start with exportProgress 0', () => {
			expect(ctx.exportProgress).toBe(0);
		});

		it('should start with exportMode rule-order', () => {
			expect(ctx.exportMode).toBe('rule-order');
		});
	});

	// ── setExportMode ────────────────────────────────────────────────────────

	describe('setExportMode', () => {
		it('should set export mode to manual', () => {
			ctx.setExportMode('manual');
			expect(ctx.exportMode).toBe('manual');
		});

		it('should set export mode back to rule-order', () => {
			ctx.setExportMode('manual');
			ctx.setExportMode('rule-order');
			expect(ctx.exportMode).toBe('rule-order');
		});
	});

	// ── setExportProgress ────────────────────────────────────────────────────

	describe('setExportProgress', () => {
		it('should update exportProgress', () => {
			ctx.setExportProgress(42);
			expect(ctx.exportProgress).toBe(42);
		});
	});

	// ── eventButtonsForRuleForm ──────────────────────────────────────────────

	describe('eventButtonsForRuleForm', () => {
		it('should return empty when no events exist', () => {
			mockEventButtonsById = { 'btn-1': createButton() };
			mockEventTimeline = [];
			expect(ctx.eventButtonsForRuleForm).toEqual([]);
		});

		it('should return only buttons that have events in the timeline', () => {
			const btn1 = createButton({ id: 'btn-1', name: 'Action A' });
			const btn2 = createButton({ id: 'btn-2', name: 'Action B' });

			mockEventButtonsById = {
				'btn-1': btn1,
				'btn-2': btn2,
				'btn-3': createButton({ id: 'btn-3', name: 'Unused' })
			};
			mockEventTimeline = [
				createEvent({ id: 'e1', buttonId: 'btn-1' }),
				createEvent({ id: 'e2', buttonId: 'btn-2' }),
				createEvent({ id: 'e3', buttonId: 'btn-1' })
			];

			const buttons = ctx.eventButtonsForRuleForm;
			expect(buttons).toHaveLength(2);
			expect(buttons.map((b) => b.id)).toContain('btn-1');
			expect(buttons.map((b) => b.id)).toContain('btn-2');
			expect(buttons.map((b) => b.id)).not.toContain('btn-3');
		});

		it('should deduplicate buttons referenced by multiple events', () => {
			mockEventButtonsById = { 'btn-1': createButton({ id: 'btn-1' }) };
			mockEventTimeline = [
				createEvent({ id: 'e1', buttonId: 'btn-1' }),
				createEvent({ id: 'e2', buttonId: 'btn-1' }),
				createEvent({ id: 'e3', buttonId: 'btn-1' })
			];

			expect(ctx.eventButtonsForRuleForm).toHaveLength(1);
		});

		it('should not include buttons not in eventButtonsById', () => {
			mockEventButtonsById = {};
			mockEventTimeline = [createEvent({ buttonId: 'orphan-btn' })];
			expect(ctx.eventButtonsForRuleForm).toEqual([]);
		});

		it('should sort buttons alphabetically by name', () => {
			const btnZ = createButton({ id: 'btn-z', name: 'Zebra' });
			const btnA = createButton({ id: 'btn-a', name: 'Alpha' });
			const btnM = createButton({ id: 'btn-m', name: 'Middle' });

			mockEventButtonsById = { 'btn-z': btnZ, 'btn-a': btnA, 'btn-m': btnM };
			mockEventTimeline = [
				createEvent({ id: 'e1', buttonId: 'btn-z' }),
				createEvent({ id: 'e2', buttonId: 'btn-a' }),
				createEvent({ id: 'e3', buttonId: 'btn-m' })
			];

			const names = ctx.eventButtonsForRuleForm.map((b) => b.name);
			expect(names).toEqual(['Alpha', 'Middle', 'Zebra']);
		});
	});

	// ── tagsForSelectedButton ────────────────────────────────────────────────

	describe('tagsForSelectedButton', () => {
		it('should return empty when newRule.include is empty', () => {
			expect(ctx.tagsForSelectedButton).toEqual([]);
		});

		it('should return tags related to events matching the selected button', () => {
			const tag1 = createTag({ id: 'tag-1', name: 'Important' });
			const tag2 = createTag({ id: 'tag-2', name: 'Other' });

			mockEventButtonsById = { 'btn-1': createButton({ id: 'btn-1' }) };
			mockTagsById = { 'tag-1': tag1, 'tag-2': tag2 };
			mockEventTimeline = [
				createEvent({ id: 'e1', buttonId: 'btn-1', tagsRelated: ['tag-1'] }),
				createEvent({ id: 'e2', buttonId: 'btn-2', tagsRelated: ['tag-2'] })
			];

			ctx.newRule.include = 'btn-1';

			const tags = ctx.tagsForSelectedButton;
			expect(tags).toHaveLength(1);
			expect(tags[0].id).toBe('tag-1');
		});

		it('should return unique tags even if multiple events reference the same tag', () => {
			const tag1 = createTag({ id: 'tag-1', name: 'Shared' });

			mockTagsById = { 'tag-1': tag1 };
			mockEventTimeline = [
				createEvent({ id: 'e1', buttonId: 'btn-1', tagsRelated: ['tag-1'] }),
				createEvent({ id: 'e2', buttonId: 'btn-1', tagsRelated: ['tag-1'] })
			];

			ctx.newRule.include = 'btn-1';
			expect(ctx.tagsForSelectedButton).toHaveLength(1);
		});

		it('should return empty when selected button has no events', () => {
			mockTagsById = { 'tag-1': createTag({ id: 'tag-1' }) };
			mockEventTimeline = [];

			ctx.newRule.include = 'btn-1';
			expect(ctx.tagsForSelectedButton).toEqual([]);
		});

		it('should skip tags not found in tagsById', () => {
			mockTagsById = {};
			mockEventTimeline = [
				createEvent({ id: 'e1', buttonId: 'btn-1', tagsRelated: ['orphan-tag'] })
			];

			ctx.newRule.include = 'btn-1';
			expect(ctx.tagsForSelectedButton).toEqual([]);
		});

		it('should return Tag objects (not options)', () => {
			const tag1 = createTag({ id: 'tag-1', name: 'Goal', color: '#00ff00' });
			mockTagsById = { 'tag-1': tag1 };
			mockEventTimeline = [createEvent({ id: 'e1', buttonId: 'btn-1', tagsRelated: ['tag-1'] })];

			ctx.newRule.include = 'btn-1';
			const result = ctx.tagsForSelectedButton[0];
			expect(result).toEqual(tag1);
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

	// ── addClipToOrder ──────────────────────────────────────────────────────

	describe('addClipToOrder', () => {
		it('should add a clip to the ordered list', () => {
			const clip = createGalleryClip({ index: 0 });
			ctx.addClipToOrder(clip);

			expect(ctx.clipsOrdered).toHaveLength(1);
			expect(ctx.clipsOrdered[0]).toEqual(clip);
		});

		it('should append clips in order', () => {
			const clip1 = createGalleryClip({ index: 0, buttonName: 'First' });
			const clip2 = createGalleryClip({ index: 1, buttonName: 'Second' });

			ctx.addClipToOrder(clip1);
			ctx.addClipToOrder(clip2);

			expect(ctx.clipsOrdered).toHaveLength(2);
			expect(ctx.clipsOrdered[0].buttonName).toBe('First');
			expect(ctx.clipsOrdered[1].buttonName).toBe('Second');
		});

		it('should allow adding the same clip multiple times', () => {
			const clip = createGalleryClip({ index: 0 });
			ctx.addClipToOrder(clip);
			ctx.addClipToOrder(clip);

			expect(ctx.clipsOrdered).toHaveLength(2);
		});
	});

	// ── removeClipFromOrder ─────────────────────────────────────────────────

	describe('removeClipFromOrder', () => {
		it('should remove a clip at the given index', () => {
			ctx.addClipToOrder(createGalleryClip({ index: 0, buttonName: 'A' }));
			ctx.addClipToOrder(createGalleryClip({ index: 1, buttonName: 'B' }));
			ctx.addClipToOrder(createGalleryClip({ index: 2, buttonName: 'C' }));

			ctx.removeClipFromOrder(1);

			expect(ctx.clipsOrdered).toHaveLength(2);
			expect(ctx.clipsOrdered[0].buttonName).toBe('A');
			expect(ctx.clipsOrdered[1].buttonName).toBe('C');
		});

		it('should handle removing from a single-item list', () => {
			ctx.addClipToOrder(createGalleryClip({ index: 0 }));
			ctx.removeClipFromOrder(0);
			expect(ctx.clipsOrdered).toHaveLength(0);
		});
	});

	// ── reorderClip ─────────────────────────────────────────────────────────

	describe('reorderClip', () => {
		it('should move a clip from one position to another', () => {
			ctx.addClipToOrder(createGalleryClip({ index: 0, buttonName: 'A' }));
			ctx.addClipToOrder(createGalleryClip({ index: 1, buttonName: 'B' }));
			ctx.addClipToOrder(createGalleryClip({ index: 2, buttonName: 'C' }));

			ctx.reorderClip(2, 0);

			expect(ctx.clipsOrdered[0].buttonName).toBe('C');
			expect(ctx.clipsOrdered[1].buttonName).toBe('A');
			expect(ctx.clipsOrdered[2].buttonName).toBe('B');
		});

		it('should do nothing when fromIdx equals toIdx', () => {
			ctx.addClipToOrder(createGalleryClip({ index: 0, buttonName: 'A' }));
			ctx.addClipToOrder(createGalleryClip({ index: 1, buttonName: 'B' }));

			ctx.reorderClip(0, 0);

			expect(ctx.clipsOrdered[0].buttonName).toBe('A');
			expect(ctx.clipsOrdered[1].buttonName).toBe('B');
		});

		it('should move forward correctly', () => {
			ctx.addClipToOrder(createGalleryClip({ index: 0, buttonName: 'A' }));
			ctx.addClipToOrder(createGalleryClip({ index: 1, buttonName: 'B' }));
			ctx.addClipToOrder(createGalleryClip({ index: 2, buttonName: 'C' }));

			ctx.reorderClip(0, 2);

			expect(ctx.clipsOrdered[0].buttonName).toBe('B');
			expect(ctx.clipsOrdered[1].buttonName).toBe('C');
			expect(ctx.clipsOrdered[2].buttonName).toBe('A');
		});
	});

	// ── resetState ──────────────────────────────────────────────────────────

	describe('resetState', () => {
		it('should reset all state to initial values', () => {
			ctx.newRule.include = 'btn-1';
			ctx.addRule();
			ctx.setExportMode('manual');
			ctx.setExportProgress(50);
			ctx.addClipToOrder(createGalleryClip());

			ctx.resetState();

			expect(ctx.rules).toEqual([]);
			expect(ctx.galleryClips).toEqual([]);
			expect(ctx.clipsOrdered).toEqual([]);
			expect(ctx.loading).toBe(false);
			expect(ctx.exportProgress).toBe(0);
			expect(ctx.exportMode).toBe('rule-order');
			expect(ctx.newRule).toEqual({
				type: CategoryType.Event,
				include: '',
				taggedWith: [],
				temp: true
			});
		});
	});
});
