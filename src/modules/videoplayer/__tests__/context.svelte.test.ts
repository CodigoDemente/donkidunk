/**
 * Tests for the Timeline class (context.svelte.ts).
 *
 * These run in a real browser via vitest-browser-svelte because the class
 * uses Svelte 5 runes ($state, $derived) which require the Svelte runtime.
 *
 * The repository and Tauri emit are mocked so no backend is needed.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { flushSync } from 'svelte';
import type { TimelineRepository } from '../../../ports/TimelineRepository';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock the Tauri event emit
vi.mock('@tauri-apps/api/event', () => ({
	emit: vi.fn().mockResolvedValue(undefined)
}));

// Mock the repository factory
const mockRepository: TimelineRepository = {
	getEvents: vi.fn().mockResolvedValue([]),
	getRangesForExport: vi.fn().mockResolvedValue([]),
	addEntry: vi.fn().mockResolvedValue(undefined),
	updateEntry: vi.fn().mockResolvedValue(undefined),
	addTagToEntry: vi.fn().mockResolvedValue(undefined),
	removeTagFromEntry: vi.fn().mockResolvedValue(undefined),
	removeEntry: vi.fn().mockResolvedValue(undefined)
};

vi.mock('../../../factories/TimelineRepositoryFactory', () => ({
	TimelineRepositoryFactory: {
		getInstance: () => mockRepository,
		create: vi.fn(),
		reset: vi.fn()
	}
}));

// Mock the undo wrapper to be a passthrough
vi.mock('../../../persistence/undo/UndoStateWrapper', () => ({
	wrapObjectForUndo: (methods: Record<string, unknown>) => methods
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

// Import Timeline *after* mocks are set up
const { Timeline } = await import('../context.svelte');
const { emit } = await import('@tauri-apps/api/event');

describe('Timeline', () => {
	let timeline: InstanceType<typeof Timeline>;
	let cleanup: () => void;

	beforeEach(() => {
		vi.clearAllMocks();
		// $effect.root creates a standalone reactive scope required by StateHistory (runed)
		// which uses $effect internally. Without this, Svelte throws "effect_orphan".
		cleanup = $effect.root(() => {
			timeline = new Timeline();
		});
	});

	afterEach(() => {
		cleanup();
	});

	// ── Initial state ────────────────────────────────────────────────────────

	describe('Initial State', () => {
		it('should start with an empty event timeline', () => {
			expect(timeline.getState().eventTimeline).toEqual([]);
		});

		it('should start with currentTime at 0', () => {
			expect(timeline.currentTime).toBe(0);
		});

		it('should start with duration at 0', () => {
			expect(timeline.duration).toBe(0);
		});

		it('should start with isPlaying as false', () => {
			expect(timeline.isPlaying).toBe(false);
		});

		it('should start with no event selected', () => {
			expect(timeline.eventSelected).toBeNull();
		});

		it('should start with empty eventsPlaying', () => {
			expect(timeline.eventsPlaying.size).toBe(0);
		});

		it('should start with no category playback', () => {
			expect(timeline.categoryPlaybackQueue).toEqual([]);
			expect(timeline.currentPlaybackIndex).toBe(-1);
			expect(timeline.currentPlaybackCategoryId).toBeNull();
		});
	});

	// ── Setters ──────────────────────────────────────────────────────────────

	describe('Setters', () => {
		it('should set currentTime', () => {
			timeline.currentTime = 42;
			expect(timeline.currentTime).toBe(42);
		});

		it('should set duration', () => {
			timeline.duration = 120;
			expect(timeline.duration).toBe(120);
		});

		it('should set isPlaying', () => {
			timeline.isPlaying = true;
			expect(timeline.isPlaying).toBe(true);
		});

		it('should set event selected', () => {
			timeline.setEventSelected('evt-123');
			expect(timeline.eventSelected).toBe('evt-123');
		});

		it('should clear event selected with null', () => {
			timeline.setEventSelected('evt-123');
			timeline.setEventSelected(null);
			expect(timeline.eventSelected).toBeNull();
		});
	});

	// ── addEvent ─────────────────────────────────────────────────────────────

	describe('addEvent', () => {
		it('should start a dynamic event (no duration) by adding it to eventsPlaying', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 5);

			expect(timeline.eventsPlaying.size).toBe(1);
			expect(timeline.eventsPlaying.has('btn-1')).toBe(true);

			const playing = timeline.eventsPlaying.get('btn-1')!;
			expect(playing.buttonId).toBe('btn-1');
			expect(playing.categoryId).toBe('cat-1');
			expect(playing.timestamp.start).toBe(5);
			expect(playing.timestamp.end).toBeUndefined();
		});

		it('should persist a fixed-duration event immediately', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 5, 10);

			// Should not be in eventsPlaying (it was persisted right away)
			expect(timeline.eventsPlaying.size).toBe(0);

			// Should have called the repository
			expect(mockRepository.addEntry).toHaveBeenCalledOnce();

			// Should have persisted to state
			expect(timeline.getState().eventTimeline).toHaveLength(1);
			const event = timeline.getState().eventTimeline[0];
			expect(event.timestamp.start).toBe(5);
			expect(event.timestamp.end).toBe(15); // 5 + 10
		});

		it('should close a dynamic event when addEvent is called again for the same button', async () => {
			// Start a dynamic event at t=5
			await timeline.addEvent('btn-1', 'cat-1', 5);
			expect(timeline.eventsPlaying.size).toBe(1);

			// Close it at t=20
			await timeline.addEvent('btn-1', 'cat-1', 20);

			// Should have been removed from eventsPlaying and persisted
			expect(timeline.eventsPlaying.size).toBe(0);
			expect(mockRepository.addEntry).toHaveBeenCalledOnce();

			const event = timeline.getState().eventTimeline[0];
			expect(event.timestamp.start).toBe(5);
			expect(event.timestamp.end).toBe(20);
		});

		it('should clear eventSelected when starting a new event', async () => {
			timeline.setEventSelected('some-event');
			await timeline.addEvent('btn-1', 'cat-1', 5);
			expect(timeline.eventSelected).toBeNull();
		});

		it('should handle "before" parameter by shifting start time backwards', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 10, 5, 3);

			const event = timeline.getState().eventTimeline[0];
			expect(event.timestamp.start).toBe(7); // 10 - 3
			expect(event.timestamp.end).toBe(15); // 10 + 5
		});

		it('should invert timestamps when end is before start during persist', async () => {
			// Start dynamic at t=20
			await timeline.addEvent('btn-1', 'cat-1', 20);
			// Close at t=5 (before start)
			await timeline.addEvent('btn-1', 'cat-1', 5);

			const event = timeline.getState().eventTimeline[0];
			// Timestamps should be inverted
			expect(event.timestamp.start).toBe(5);
			expect(event.timestamp.end).toBe(20);
		});

		it('should emit project:dirty when persisting an event', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			expect(emit).toHaveBeenCalledWith('project:dirty');
		});
	});

	// ── closeOpenedEvent ─────────────────────────────────────────────────────

	describe('closeOpenedEvent', () => {
		it('should do nothing when no events are playing', async () => {
			await timeline.closeOpenedEvent();
			expect(mockRepository.addEntry).not.toHaveBeenCalled();
		});

		it('should persist all currently playing events', async () => {
			// Start two dynamic events
			await timeline.addEvent('btn-1', 'cat-1', 5);
			await timeline.addEvent('btn-2', 'cat-1', 8);
			expect(timeline.eventsPlaying.size).toBe(2);

			await timeline.closeOpenedEvent();

			expect(mockRepository.addEntry).toHaveBeenCalledTimes(2);
			expect(timeline.getState().eventTimeline).toHaveLength(2);
		});
	});

	// ── updateEvent ──────────────────────────────────────────────────────────

	describe('updateEvent', () => {
		it('should update an existing event timestamp in state and repository', async () => {
			// First, persist an event
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			const eventId = timeline.getState().eventTimeline[0].id;

			// Update its timestamp
			await timeline.updateEvent(eventId, 'btn-1', 'cat-1', { start: 2, end: 12 });

			expect(mockRepository.updateEntry).toHaveBeenCalledWith({
				id: eventId,
				buttonId: 'btn-1',
				categoryId: 'cat-1',
				timestamp: { start: 2, end: 12 }
			});

			const updated = timeline.getState().eventTimeline[0];
			expect(updated.timestamp.start).toBe(2);
			expect(updated.timestamp.end).toBe(12);
		});

		it('should emit project:dirty after update', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			vi.clearAllMocks();

			const eventId = timeline.getState().eventTimeline[0].id;
			await timeline.updateEvent(eventId, 'btn-1', 'cat-1', { start: 1, end: 11 });

			expect(emit).toHaveBeenCalledWith('project:dirty');
		});
	});

	// ── removeEvent ──────────────────────────────────────────────────────────

	describe('removeEvent', () => {
		it('should remove an event from state and repository', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			const eventId = timeline.getState().eventTimeline[0].id;

			await timeline.removeEvent(eventId);

			expect(timeline.getState().eventTimeline).toHaveLength(0);
			expect(mockRepository.removeEntry).toHaveBeenCalledWith(eventId);
		});

		it('should emit project:dirty after removal', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			vi.clearAllMocks();

			const eventId = timeline.getState().eventTimeline[0].id;
			await timeline.removeEvent(eventId);

			expect(emit).toHaveBeenCalledWith('project:dirty');
		});
	});

	// ── removeAllEventsFromButtons ────────────────────────────────────────────

	describe('removeAllEventsFromButtons', () => {
		it('should remove all events matching given button IDs', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			await timeline.addEvent('btn-2', 'cat-1', 5, 10);
			await timeline.addEvent('btn-3', 'cat-1', 10, 10);
			expect(timeline.getState().eventTimeline).toHaveLength(3);

			await timeline.removeAllEventsFromButtons(['btn-1', 'btn-3']);

			expect(timeline.getState().eventTimeline).toHaveLength(1);
			expect(timeline.getState().eventTimeline[0].buttonId).toBe('btn-2');
		});
	});

	// ── removeAllTagsFromButtons ─────────────────────────────────────────────

	describe('removeAllTagsFromButtons', () => {
		it('should remove specified tags from all events', async () => {
			// Persist an event with tags
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			const state = timeline.getState();
			state.eventTimeline[0].tagsRelated = ['tag-1', 'tag-2', 'tag-3'];

			await timeline.removeAllTagsFromButtons(['tag-1', 'tag-3']);

			expect(timeline.getState().eventTimeline[0].tagsRelated).toEqual(['tag-2']);
		});
	});

	// ── addRelatedTagToEvent ─────────────────────────────────────────────────

	describe('addRelatedTagToEvent', () => {
		it('should add a tag to the last playing event', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 5);

			await timeline.addRelatedTagToEvent('tag-1');

			const playing = timeline.eventsPlaying.get('btn-1')!;
			expect(playing.tagsRelated).toContain('tag-1');
		});

		it('should toggle (remove) a tag if it already exists on the playing event', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 5);
			await timeline.addRelatedTagToEvent('tag-1');
			await timeline.addRelatedTagToEvent('tag-1'); // Toggle off

			const playing = timeline.eventsPlaying.get('btn-1')!;
			expect(playing.tagsRelated).not.toContain('tag-1');
		});

		it('should add a tag to the selected event when no event is playing', async () => {
			// Persist an event first
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			const eventId = timeline.getState().eventTimeline[0].id;
			timeline.setEventSelected(eventId);

			await timeline.addRelatedTagToEvent('tag-1');

			expect(timeline.getState().eventTimeline[0].tagsRelated).toContain('tag-1');
			expect(mockRepository.addTagToEntry).toHaveBeenCalledWith(eventId, 'tag-1');
		});

		it('should remove a tag from the selected event if it already exists', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);
			const eventId = timeline.getState().eventTimeline[0].id;
			timeline.setEventSelected(eventId);

			await timeline.addRelatedTagToEvent('tag-1'); // Add
			await timeline.addRelatedTagToEvent('tag-1'); // Remove

			expect(timeline.getState().eventTimeline[0].tagsRelated).not.toContain('tag-1');
			expect(mockRepository.removeTagFromEntry).toHaveBeenCalledWith(eventId, 'tag-1');
		});
	});

	// ── isEventPlaying ───────────────────────────────────────────────────────

	describe('isEventPlaying', () => {
		it('should return false when no event is playing for the button', () => {
			expect(timeline.isEventPlaying('btn-1')).toBe(false);
		});

		it('should return true when an event is playing for the button', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 5);
			expect(timeline.isEventPlaying('btn-1')).toBe(true);
		});

		it('should return false after the event is closed', async () => {
			await timeline.addEvent('btn-1', 'cat-1', 5);
			await timeline.addEvent('btn-1', 'cat-1', 10); // close
			expect(timeline.isEventPlaying('btn-1')).toBe(false);
		});
	});

	// ── Category playback ────────────────────────────────────────────────────

	describe('Category Playback', () => {
		async function setupEventsForCategory() {
			// Create 3 fixed events in the same category
			await timeline.addEvent('btn-1', 'cat-1', 0, 5);
			await timeline.addEvent('btn-2', 'cat-1', 10, 5);
			await timeline.addEvent('btn-3', 'cat-1', 20, 5);
		}

		it('should start playback from the first event', async () => {
			await setupEventsForCategory();

			flushSync(); // Ensure $derived updates
			timeline.playAllEventsFromCategory('cat-1');

			expect(timeline.categoryPlaybackQueue).toHaveLength(3);
			expect(timeline.currentPlaybackIndex).toBe(0);
			expect(timeline.currentTime).toBe(0); // First event starts at 0
		});

		it('should report the correct playback category ID', async () => {
			await setupEventsForCategory();

			flushSync();
			timeline.playAllEventsFromCategory('cat-1');

			expect(timeline.currentPlaybackCategoryId).toBe('cat-1');
		});

		it('should return the current event from the queue', async () => {
			await setupEventsForCategory();

			flushSync();
			timeline.playAllEventsFromCategory('cat-1');

			const current = timeline.getNextEventInQueue();
			expect(current).not.toBeNull();
			expect(current!.buttonId).toBe('btn-1');
		});

		it('should move to the next event in queue', async () => {
			await setupEventsForCategory();

			flushSync();
			timeline.playAllEventsFromCategory('cat-1');

			const hasNext = timeline.moveToNextEvent();
			expect(hasNext).toBe(true);
			expect(timeline.currentPlaybackIndex).toBe(1);
			expect(timeline.currentTime).toBe(10); // Second event starts at 10
		});

		it('should return false and stop when all events have been played', async () => {
			await setupEventsForCategory();

			flushSync();
			timeline.playAllEventsFromCategory('cat-1');

			timeline.moveToNextEvent(); // -> index 1
			timeline.moveToNextEvent(); // -> index 2
			const hasNext = timeline.moveToNextEvent(); // -> end

			expect(hasNext).toBe(false);
			expect(timeline.categoryPlaybackQueue).toEqual([]);
			expect(timeline.currentPlaybackIndex).toBe(-1);
		});

		it('should stop category playback', async () => {
			await setupEventsForCategory();

			flushSync();
			timeline.playAllEventsFromCategory('cat-1');

			timeline.stopCategoryPlayback();

			expect(timeline.categoryPlaybackQueue).toEqual([]);
			expect(timeline.currentPlaybackIndex).toBe(-1);
			expect(timeline.currentPlaybackCategoryId).toBeNull();
		});

		it('should do nothing when playing from a non-existent category', async () => {
			flushSync();
			timeline.playAllEventsFromCategory('non-existent');

			expect(timeline.categoryPlaybackQueue).toEqual([]);
			expect(timeline.currentPlaybackIndex).toBe(-1);
		});

		it('should skip dynamic events (no end time) from the playback queue', async () => {
			// Add a dynamic event (no duration) - need to start and NOT close it
			// and a fixed event
			await timeline.addEvent('btn-1', 'cat-1', 0, 5); // fixed
			await timeline.addEvent('btn-2', 'cat-1', 10); // dynamic (stays in eventsPlaying, not in state)

			flushSync();
			timeline.playAllEventsFromCategory('cat-1');

			// Only the fixed event should be in the queue
			expect(timeline.categoryPlaybackQueue).toHaveLength(1);
			expect(timeline.categoryPlaybackQueue[0].buttonId).toBe('btn-1');
		});

		it('should sort events by start time', async () => {
			// Add events out of order
			await timeline.addEvent('btn-2', 'cat-1', 20, 5);
			await timeline.addEvent('btn-1', 'cat-1', 5, 5);
			await timeline.addEvent('btn-3', 'cat-1', 10, 5);

			flushSync();
			timeline.playAllEventsFromCategory('cat-1');

			expect(timeline.categoryPlaybackQueue[0].timestamp.start).toBe(5);
			expect(timeline.categoryPlaybackQueue[1].timestamp.start).toBe(10);
			expect(timeline.categoryPlaybackQueue[2].timestamp.start).toBe(20);
		});
	});

	// ── Reset ────────────────────────────────────────────────────────────────

	describe('reset', () => {
		it('should reset all state to initial values', async () => {
			// Dirty up the state
			timeline.currentTime = 42;
			timeline.duration = 120;
			timeline.setEventSelected('evt-1');
			await timeline.addEvent('btn-1', 'cat-1', 0, 10);

			timeline.reset();

			expect(timeline.getState().eventTimeline).toEqual([]);
			expect(timeline.currentTime).toBe(0);
			expect(timeline.duration).toBe(0);
			expect(timeline.eventSelected).toBeNull();
			expect(timeline.eventsPlaying.size).toBe(0);
			expect(timeline.categoryPlaybackQueue).toEqual([]);
			expect(timeline.currentPlaybackIndex).toBe(-1);
		});
	});
});
