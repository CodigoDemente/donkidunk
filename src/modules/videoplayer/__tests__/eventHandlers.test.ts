import { describe, expect, it, vi, beforeEach } from 'vitest';

// vi.mock is hoisted to the top of the file by Vitest, so any variable
// referenced inside the factory must also be hoisted via vi.hoisted().
// Without this, `mockPopup` would be `undefined` when the factory runs
// because `const` declarations aren't initialized until their lexical position.
const { mockPopup } = vi.hoisted(() => ({
	mockPopup: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@tauri-apps/api/menu', () => ({
	MenuItem: {
		new: vi.fn().mockResolvedValue({ text: '', action: vi.fn() })
	},
	Menu: {
		new: vi.fn().mockResolvedValue({ popup: mockPopup })
	}
}));

import {
	handleEventClick,
	handleEventBlur,
	handleEventDblClick,
	handleEventResize,
	handleCategoryPlayAll,
	handleEventContextMenu
} from '../handlers/eventHandlers';
import type { Timeline } from '../context.svelte';

function createMockTimeline(overrides: Partial<Record<string, unknown>> = {}): Timeline {
	return {
		eventsPlaying: new Map(),
		setEventSelected: vi.fn(),
		updateEvent: vi.fn().mockResolvedValue(undefined),
		playAllEventsFromCategory: vi.fn(),
		stopCategoryPlayback: vi.fn(),
		removeEvent: vi.fn().mockResolvedValue(undefined),
		currentPlaybackCategoryId: null,
		...overrides
	} as unknown as Timeline;
}

describe('handleEventClick', () => {
	it('should select the event when no event is playing for the button', () => {
		const timeline = createMockTimeline();
		handleEventClick(timeline, 'evt-1', 'btn-1');
		expect(timeline.setEventSelected).toHaveBeenCalledWith('evt-1');
	});

	it('should NOT select the event when the button has an event playing', () => {
		const playing = new Map([['btn-1', { buttonId: 'btn-1' }]]);
		const timeline = createMockTimeline({ eventsPlaying: playing });
		handleEventClick(timeline, 'evt-1', 'btn-1');
		expect(timeline.setEventSelected).not.toHaveBeenCalled();
	});
});

describe('handleEventBlur', () => {
	it('should deselect when no events are playing', () => {
		const timeline = createMockTimeline();
		handleEventBlur(timeline);
		expect(timeline.setEventSelected).toHaveBeenCalledWith(null);
	});

	it('should NOT deselect when events are playing', () => {
		const playing = new Map([['btn-1', { buttonId: 'btn-1' }]]);
		const timeline = createMockTimeline({ eventsPlaying: playing });
		handleEventBlur(timeline);
		expect(timeline.setEventSelected).not.toHaveBeenCalled();
	});
});

describe('handleEventDblClick', () => {
	it('should navigate to timestamp and select event', () => {
		const timeline = createMockTimeline();
		const onTimeChange = vi.fn();
		handleEventDblClick(timeline, 42, 'evt-1', 'btn-1', onTimeChange);
		expect(onTimeChange).toHaveBeenCalledWith(42);
		expect(timeline.setEventSelected).toHaveBeenCalledWith('evt-1');
	});

	it('should do nothing when events are playing', () => {
		const playing = new Map([['btn-1', { buttonId: 'btn-1' }]]);
		const timeline = createMockTimeline({ eventsPlaying: playing });
		const onTimeChange = vi.fn();
		handleEventDblClick(timeline, 42, 'evt-1', 'btn-1', onTimeChange);
		expect(onTimeChange).not.toHaveBeenCalled();
	});
});

describe('handleEventResize', () => {
	it('should select the event and update timestamps', async () => {
		const timeline = createMockTimeline();
		await handleEventResize(timeline, 'evt-1', 'btn-1', 'cat-1', 5, 15);
		expect(timeline.setEventSelected).toHaveBeenCalledWith('evt-1');
		expect(timeline.updateEvent).toHaveBeenCalledWith('evt-1', 'btn-1', 'cat-1', {
			start: 5,
			end: 15
		});
	});

	it('should do nothing when events are playing', async () => {
		const playing = new Map([['btn-other', { buttonId: 'btn-other' }]]);
		const timeline = createMockTimeline({ eventsPlaying: playing });
		await handleEventResize(timeline, 'evt-1', 'btn-1', 'cat-1', 5, 15);
		expect(timeline.updateEvent).not.toHaveBeenCalled();
	});
});

describe('handleCategoryPlayAll', () => {
	it('should start category playback when no category is playing', () => {
		const timeline = createMockTimeline();
		handleCategoryPlayAll(timeline, 'cat-1');
		expect(timeline.playAllEventsFromCategory).toHaveBeenCalledWith('cat-1');
	});

	it('should stop playback when same category is already playing', () => {
		const timeline = createMockTimeline({ currentPlaybackCategoryId: 'cat-1' });
		handleCategoryPlayAll(timeline, 'cat-1');
		expect(timeline.stopCategoryPlayback).toHaveBeenCalled();
		expect(timeline.playAllEventsFromCategory).not.toHaveBeenCalled();
	});

	it('should start new category when a different category is playing', () => {
		const timeline = createMockTimeline({ currentPlaybackCategoryId: 'cat-2' });
		handleCategoryPlayAll(timeline, 'cat-1');
		expect(timeline.playAllEventsFromCategory).toHaveBeenCalledWith('cat-1');
	});
});

describe('handleEventContextMenu', () => {
	let MenuItemNew: ReturnType<typeof vi.fn>;
	let MenuNew: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const menuModule = await import('@tauri-apps/api/menu');
		MenuItemNew = menuModule.MenuItem.new as ReturnType<typeof vi.fn>;
		MenuNew = menuModule.Menu.new as ReturnType<typeof vi.fn>;
	});

	it('should create a context menu with a delete option', async () => {
		const timeline = createMockTimeline();
		await handleEventContextMenu(timeline, 'evt-1');

		expect(MenuItemNew).toHaveBeenCalledWith(expect.objectContaining({ text: 'Delete event' }));
		expect(MenuNew).toHaveBeenCalled();
		expect(mockPopup).toHaveBeenCalled();
	});

	it('should call removeEvent when the delete action is triggered', async () => {
		const timeline = createMockTimeline();

		// Capture the action callback
		let deleteAction: (() => Promise<void>) | undefined;
		MenuItemNew.mockImplementation(async (opts: { action: () => Promise<void> }) => {
			deleteAction = opts.action;
			return { text: opts };
		});

		await handleEventContextMenu(timeline, 'evt-1');

		expect(deleteAction).toBeDefined();
		await deleteAction!();
		expect(timeline.removeEvent).toHaveBeenCalledWith('evt-1');
	});
});
