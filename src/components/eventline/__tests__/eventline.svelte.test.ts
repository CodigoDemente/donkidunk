import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Eventline from '../eventline.svelte';
import { timelineContext } from '../../../modules/videoplayer/context.svelte';
import type { RangeDataWithTags } from '../../../modules/videoplayer/types/RangeData';
import type { Button } from '../../../modules/board/types/Button';
import type { Category } from '../../../modules/board/types/Category';
import { SvelteMap } from 'svelte/reactivity';

// ─── Mock factories ──────────────────────────────────────────────────────────

function createMockTimeline(overrides: Record<string, unknown> = {}) {
	return {
		duration: 60,
		...overrides
	};
}

function createMockEvent(overrides: Partial<RangeDataWithTags> = {}): RangeDataWithTags {
	return {
		id: `event-${Math.random().toString(36).slice(2, 8)}`,
		buttonId: 'btn-1',
		categoryId: 'cat-1',
		timestamp: { start: 5, end: 15 },
		tagsRelated: [],
		...overrides
	};
}

function createMockButton(overrides: Partial<Button> = {}): Button {
	return {
		id: 'btn-1',
		name: 'Action A',
		color: '#3b82f6',
		duration: null,
		before: null,
		...overrides
	};
}

function createMockCategory(overrides: Partial<Category> = {}): Category {
	return {
		id: 'cat-1',
		name: 'Events',
		type: 'event',
		color: '#22c55e',
		position: { x: 0, y: 0 },
		buttons: [],
		...overrides
	} as Category;
}

// ─── Render helper ───────────────────────────────────────────────────────────

type EventlineRenderOptions = {
	categoryId?: string;
	allTagsByCategory?: Record<string, RangeDataWithTags[]>;
	timelineStart?: number;
	timelineEnd?: number;
	boardCategoriesById?: Record<string, Category>;
	buttonsListById?: Record<string, Button>;
	playingObjects?: SvelteMap<string, RangeDataWithTags>;
	eventSelected?: string | null;
	currentTime?: number;
	onEventClick?: (eventId: string, buttonId: string) => void;
	onEventDblClick?: (startTimestamp: number, eventId: string, buttonId: string) => void;
	onEventResize?: (
		eventId: string,
		buttonId: string,
		categoryId: string,
		newStart: number,
		newEnd: number
	) => void;
	onEventContextMenu?: (eventId: string) => void;
	skeleton?: boolean;
	mockTimeline?: ReturnType<typeof createMockTimeline>;
};

function renderEventline(options: EventlineRenderOptions = {}) {
	const {
		categoryId = 'cat-1',
		allTagsByCategory = {},
		timelineStart = 0,
		timelineEnd = 1,
		boardCategoriesById = { 'cat-1': createMockCategory() },
		buttonsListById = { 'btn-1': createMockButton() },
		playingObjects = undefined,
		eventSelected = null,
		currentTime = 0,
		onEventClick = vi.fn(),
		onEventDblClick = vi.fn(),
		onEventResize = vi.fn(),
		onEventContextMenu = undefined,
		skeleton = false,
		mockTimeline = createMockTimeline()
	} = options;

	return render(Eventline, {
		props: {
			categoryId,
			allTagsByCategory,
			timelineStart,
			timelineEnd,
			boardCategoriesById,
			buttonsListById,
			playingObjects,
			eventSelected,
			currentTime,
			onEventClick,
			onEventDblClick,
			onEventResize,
			onEventContextMenu,
			skeleton
		},
		context: new Map<symbol, unknown>([[timelineContext.key, mockTimeline]])
	});
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Eventline Component', () => {
	describe('Rendering', () => {
		it('should render the eventline container', async () => {
			const { container } = renderEventline();
			const eventline = container.querySelector('.bg-gray-900');
			expect(eventline).not.toBeNull();
		});

		it('should render clips for events in the visible range', async () => {
			const event = createMockEvent({
				id: 'e1',
				buttonId: 'btn-1',
				categoryId: 'cat-1',
				timestamp: { start: 5, end: 15 }
			});

			renderEventline({
				categoryId: 'cat-1',
				allTagsByCategory: { 'cat-1': [event] },
				timelineStart: 0,
				timelineEnd: 1,
				currentTime: 30
			});

			const clip = page.getByRole('button', { name: 'Action A' });
			await expect.element(clip).toBeInTheDocument();
		});

		it('should not render clips outside the visible range', async () => {
			const event = createMockEvent({
				id: 'e1',
				buttonId: 'btn-1',
				categoryId: 'cat-1',
				timestamp: { start: 50, end: 55 }
			});

			const { container } = renderEventline({
				categoryId: 'cat-1',
				allTagsByCategory: { 'cat-1': [event] },
				timelineStart: 0,
				timelineEnd: 0.5, // Only first half visible (0-30s)
				currentTime: 30
			});

			const clips = container.querySelectorAll('[role="button"]');
			expect(clips.length).toBe(0);
		});

		it('should render multiple clips for multiple events', async () => {
			const button2 = createMockButton({ id: 'btn-2', name: 'Action B' });
			const events = [
				createMockEvent({
					id: 'e1',
					buttonId: 'btn-1',
					timestamp: { start: 5, end: 15 }
				}),
				createMockEvent({
					id: 'e2',
					buttonId: 'btn-2',
					timestamp: { start: 20, end: 30 }
				})
			];

			renderEventline({
				categoryId: 'cat-1',
				allTagsByCategory: { 'cat-1': events },
				buttonsListById: {
					'btn-1': createMockButton(),
					'btn-2': button2
				}
			});

			await expect.element(page.getByRole('button', { name: 'Action A' })).toBeInTheDocument();
			await expect.element(page.getByRole('button', { name: 'Action B' })).toBeInTheDocument();
		});
	});

	describe('Skeleton mode', () => {
		it('should not render any clips in skeleton mode', async () => {
			const event = createMockEvent({
				timestamp: { start: 5, end: 15 }
			});

			const { container } = renderEventline({
				categoryId: 'cat-1',
				allTagsByCategory: { 'cat-1': [event] },
				skeleton: true
			});

			const clips = container.querySelectorAll('[role="button"]');
			expect(clips.length).toBe(0);
		});
	});

	describe('Event selection', () => {
		it('should mark the selected event clip', async () => {
			const event = createMockEvent({
				id: 'selected-event',
				buttonId: 'btn-1',
				timestamp: { start: 5, end: 15 }
			});

			renderEventline({
				categoryId: 'cat-1',
				allTagsByCategory: { 'cat-1': [event] },
				eventSelected: 'selected-event'
			});

			const clip = page.getByRole('button', { name: 'Action A' });
			await expect.element(clip).toHaveClass('opacity-90');
		});
	});

	describe('Playing objects', () => {
		it('should render playing events', async () => {
			const playingObject: RangeDataWithTags = {
				id: 'playing-1',
				buttonId: 'btn-1',
				categoryId: 'cat-1',
				timestamp: { start: 10, end: undefined },
				tagsRelated: []
			};

			const playingMap = new SvelteMap<string, RangeDataWithTags>();
			playingMap.set('playing-1', playingObject);

			renderEventline({
				categoryId: 'cat-1',
				allTagsByCategory: {},
				playingObjects: playingMap,
				currentTime: 20
			});

			const clip = page.getByRole('button', { name: 'Action A' });
			await expect.element(clip).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('should render empty eventline when no events exist for category', async () => {
			const { container } = renderEventline({
				categoryId: 'cat-1',
				allTagsByCategory: {}
			});

			const clips = container.querySelectorAll('[role="button"]');
			expect(clips.length).toBe(0);
		});

		it('should render empty eventline when category has empty array', async () => {
			const { container } = renderEventline({
				categoryId: 'cat-1',
				allTagsByCategory: { 'cat-1': [] }
			});

			const clips = container.querySelectorAll('[role="button"]');
			expect(clips.length).toBe(0);
		});
	});
});
