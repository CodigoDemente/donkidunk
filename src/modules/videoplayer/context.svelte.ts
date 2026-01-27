import { Context, StateHistory } from 'runed';
import { v7 as uuidv7 } from 'uuid';
import type { TimelineData } from './types/Timeline';
import type { RangeDataWithTags } from './types/RangeData';
import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
import { emit } from '@tauri-apps/api/event';
import { wrapObjectForUndo } from '../../persistence/undo/UndoStateWrapper';
import { Scope } from '../../persistence/undo/types/Scope';
import { SvelteMap } from 'svelte/reactivity';

const initialState: TimelineData = {
	eventTimeline: []
};

export const timelineContext = new Context<Timeline>('');

export class Timeline {
	#history!: StateHistory<TimelineData>;
	#state = $state<TimelineData>(initialState);
	#isPlaying = $state(false);
	#eventPlaying = $state<RangeDataWithTags | null>(null);
	#eventsPlaying = $state<SvelteMap<string, RangeDataWithTags>>(new SvelteMap());
	#currentTime: number = $state(0);
	#duration: number = $state(0);
	#eventSelected = $state<string | null>(null);
	#timelineEventsByCategory!: Record<string, RangeDataWithTags[]>;
	#categoryPlaybackQueue = $state<RangeDataWithTags[]>([]);
	#currentPlaybackIndex = $state<number>(-1);

	constructor() {
		this.#history = new StateHistory<TimelineData>(
			() => $state.snapshot(this.#state),
			(n) => (this.#state = n)
		);

		//#region Selector derived states
		this.#timelineEventsByCategory = $derived.by(() => {
			return this.#state.eventTimeline.reduce(
				(acc, event) => {
					if (!acc[event.categoryId]) {
						acc[event.categoryId] = [];
					}
					acc[event.categoryId].push(event);
					return acc;
				},
				{} as Record<string, RangeDataWithTags[]>
			);
		});
		//#endregion
	}

	getState() {
		return this.#state;
	}

	reset() {
		this.#state = initialState;
		this.#history.clear();
		this.#eventPlaying = null;
		this.#eventsPlaying = new SvelteMap();
		this.#currentTime = 0;
		this.#duration = 0;
		this.#eventSelected = null;
		this.#categoryPlaybackQueue = [];
		this.#currentPlaybackIndex = -1;
		this.#history.clear();
	}

	canUndo() {
		return this.#history.canUndo;
	}

	canRedo() {
		return this.#history.canRedo;
	}

	undo() {
		this.#history.undo();
	}

	redo() {
		this.#history.redo();
	}

	private createNewEvent(
		buttonId: string,
		categoryId: string,
		timeCursor: number,
		duration?: number,
		before?: number
	): RangeDataWithTags {
		let start = timeCursor;
		let end = undefined; // Assuming end is undefined for new dynamic events

		if (duration) {
			end = timeCursor + duration;
		}

		if (before) {
			start = timeCursor - before;
		}

		return {
			id: uuidv7(),
			buttonId: buttonId,
			categoryId: categoryId,
			timestamp: {
				start: start,
				end: end
			},
			tagsRelated: []
		};
	}

	private async persistEvent(event: RangeDataWithTags) {
		const repository = TimelineRepositoryFactory.getInstance();

		// If end is before start, invert the timestamps
		let eventToPersist = { ...event };
		if (
			eventToPersist.timestamp.end !== undefined &&
			eventToPersist.timestamp.end !== null &&
			eventToPersist.timestamp.end < eventToPersist.timestamp.start
		) {
			eventToPersist = {
				...eventToPersist,
				timestamp: {
					start: eventToPersist.timestamp.end,
					end: eventToPersist.timestamp.start
				}
			};
		}

		await repository.addEntry(eventToPersist);

		this.#state = {
			...this.#state,
			eventTimeline: [...this.#state.eventTimeline, eventToPersist]
		};

		this.#eventSelected = eventToPersist.id;
		this.#eventsPlaying.delete(event.buttonId);

		await emit('project:dirty');
	}

	//#region Actions
	async addEvent(
		buttonId: string,
		categoryId: string,
		timeCursor: number,
		duration?: number,
		before?: number
	) {
		const newEvent = this.createNewEvent(buttonId, categoryId, timeCursor, duration, before);

		if (!this.#eventsPlaying.has(buttonId)) {
			if (duration === undefined) {
				this.#eventsPlaying.set(buttonId, newEvent);
				this.#eventSelected = null; // Clear any selected event
				return;
			}

			// Here we don't add it to eventsPlaying because it's a fixed duration event and it will be persisted
			// right away.
			this.#eventSelected = null; // Clear any selected event
			return await this.persistEvent(newEvent);
		}

		const eventPlaying = this.#eventsPlaying.get(buttonId);
		if (eventPlaying) {
			const categoryEvents = this.#timelineEventsByCategory[categoryId] || [];
			const playingEventStart = eventPlaying.timestamp.start;
			const isReversed = timeCursor < playingEventStart;

			// Calculate the actual range boundaries (min as start, max as end)
			const actualStart = isReversed ? timeCursor : playingEventStart;
			const actualEnd = isReversed ? playingEventStart : timeCursor;

			const overlappingEvent = categoryEvents.find((event) => {
				const existingEventStart = event.timestamp.start;
				const existingEventEnd = event.timestamp.end ?? Infinity;
				return actualStart < existingEventEnd && actualEnd > existingEventStart;
			});

			if (overlappingEvent) {
				if (isReversed) {
					// Going backward: the event will be inverted in persistEvent
					eventPlaying.timestamp.start = overlappingEvent.timestamp.start - 0.001;
					eventPlaying.timestamp.end = timeCursor;
				} else {
					// Going forward: end the playing event one microsecond before the overlapping event starts
					eventPlaying.timestamp.end = overlappingEvent.timestamp.start - 0.001;
				}
			} else {
				// No overlap, end at timeCursor as usual
				eventPlaying.timestamp.end = timeCursor;
			}

			return await this.persistEvent(eventPlaying);
		}
	}

	async updateEvent(
		eventId: string,
		buttonId: string,
		categoryId: string,
		timestamp: { start: number; end: number }
	) {
		const repository = TimelineRepositoryFactory.getInstance();

		await repository.updateEntry({ id: eventId, buttonId, categoryId, timestamp });

		this.#state = {
			...this.#state,
			eventTimeline: this.#state.eventTimeline.map((event) =>
				event.id === eventId ? { ...event, timestamp } : event
			)
		};

		await emit('project:dirty');
	}

	setEventSelected(eventId: string | null) {
		this.#eventSelected = eventId;
	}

	async addRelatedTagToEvent(tagId: string) {
		const repository = TimelineRepositoryFactory.getInstance();

		let op = 'add';

		// Helper to toggle a tag in a tagsRelated array
		const toggleTag = (tags: string[]) => {
			if (tags.includes(tagId)) {
				op = 'remove';

				return tags.filter((tag) => tag !== tagId);
			}

			return [...tags, tagId];
		};

		const eventsPlaying = Array.from(this.#eventsPlaying);
		const lastEvent = eventsPlaying[eventsPlaying.length - 1];

		if (eventsPlaying.length > 0) {
			this.#eventsPlaying.get(lastEvent[0])!.tagsRelated = toggleTag(
				this.#eventsPlaying.get(lastEvent[0])!.tagsRelated
			);
			return;
		} else if (this.#eventSelected) {
			const newEventTimeline = this.#state.eventTimeline.map((event) =>
				event.id === this.#eventSelected
					? { ...event, tagsRelated: toggleTag(event.tagsRelated) }
					: event
			);

			this.#state = {
				...this.#state,
				eventTimeline: newEventTimeline
			};
		}

		if (eventsPlaying.length > 0 || this.#eventSelected) {
			if (op === 'add') {
				await repository.addTagToEntry(this.#eventSelected || lastEvent[0], tagId);
			} else {
				await repository.removeTagFromEntry(this.#eventSelected || lastEvent[0], tagId);
			}
		}

		await emit('project:dirty');
	}

	async removeEvent(eventId: string) {
		const repository = TimelineRepositoryFactory.getInstance();

		const newEventTimeline = this.#state.eventTimeline.filter((e) => e.id !== eventId);
		this.#state = {
			...this.#state,
			eventTimeline: newEventTimeline
		};

		await repository.removeEntry(eventId);

		await emit('project:dirty');
	}

	async removeAllEventsFromCategory(categoryId: string) {
		const events = this.#timelineEventsByCategory[categoryId];

		if (!events) {
			return;
		}

		events.forEach(async (event) => {
			await this.removeEvent(event.id);
		});
	}

	async removeAllEventsFromButtons(buttonIds: string[]) {
		const eventsToRemove = this.#state.eventTimeline.filter((event) =>
			buttonIds.includes(event.buttonId)
		);

		for (const event of eventsToRemove) {
			await this.removeEvent(event.id);
		}
	}

	async removeAllTagsFromButtons(buttonIds: string[]) {
		this.#state.eventTimeline.forEach((event) => {
			event.tagsRelated = event.tagsRelated.filter((tag) => !buttonIds.includes(tag));
		});
	}

	wrapForUndo() {
		Object.assign(
			this,
			wrapObjectForUndo(
				{
					persistEvent: this.persistEvent.bind(this),
					addRelatedTagToEvent: this.addRelatedTagToEvent.bind(this),
					removeEvent: this.removeEvent.bind(this)
				},
				Scope.Timeline
			)
		);

		return this;
	}
	//#endregion

	//#region Selectors and setters
	get isPlaying() {
		return this.#isPlaying;
	}

	set isPlaying(value: boolean) {
		this.#isPlaying = value;
	}

	get eventPlaying() {
		return this.#eventPlaying;
	}

	get eventsPlaying() {
		return this.#eventsPlaying;
	}

	get eventSelected() {
		return this.#eventSelected;
	}

	get eventsByCategory() {
		return this.#timelineEventsByCategory;
	}

	get currentTime() {
		return this.#currentTime;
	}

	set currentTime(value: number) {
		this.#currentTime = value;
	}

	get duration() {
		return this.#duration;
	}

	set duration(value: number) {
		this.#duration = value;
	}

	get categoryPlaybackQueue() {
		return this.#categoryPlaybackQueue;
	}

	get currentPlaybackIndex() {
		return this.#currentPlaybackIndex;
	}

	get currentPlaybackCategoryId(): string | null {
		if (this.#categoryPlaybackQueue.length === 0 || this.#currentPlaybackIndex < 0) {
			return null;
		}
		return this.#categoryPlaybackQueue[0]?.categoryId || null;
	}

	isTimeOverlappingWithCategoryEvent(categoryId: string, buttonId: string): boolean {
		const categoryEvents = this.#timelineEventsByCategory[categoryId] || [];
		const currentTime = this.#currentTime;

		for (const event of categoryEvents) {
			const eventStart = event.timestamp.start;
			const eventEnd = event.timestamp.end ?? Infinity;

			if (currentTime >= eventStart && currentTime < eventEnd) {
				// If the button is not in eventsPlaying, it's overlapping
				if (!this.#eventsPlaying.has(buttonId)) {
					return true;
				}
			}
		}

		return false;
	}

	playAllEventsFromCategory(categoryId: string) {
		const events = this.#timelineEventsByCategory[categoryId];
		if (!events || events.length === 0) return;

		// Sort events by start time
		const sortedEvents = [...events].sort((a, b) => a.timestamp.start - b.timestamp.start);

		// Filter out events without end time (dynamic events)
		const eventsWithEnd = sortedEvents.filter(
			(event) => event.timestamp.end !== undefined && event.timestamp.end !== null
		);

		if (eventsWithEnd.length === 0) return;

		// Set up playback queue
		this.#categoryPlaybackQueue = eventsWithEnd;
		this.#currentPlaybackIndex = 0;

		// Start playing the first event
		const firstEvent = eventsWithEnd[0];
		this.#currentTime = firstEvent.timestamp.start;
	}

	stopCategoryPlayback() {
		this.#categoryPlaybackQueue = [];
		this.#currentPlaybackIndex = -1;
	}

	getNextEventInQueue(): RangeDataWithTags | null {
		if (
			this.#currentPlaybackIndex < 0 ||
			this.#currentPlaybackIndex >= this.#categoryPlaybackQueue.length
		) {
			return null;
		}
		return this.#categoryPlaybackQueue[this.#currentPlaybackIndex];
	}

	moveToNextEvent() {
		if (this.#currentPlaybackIndex < 0) return false;

		this.#currentPlaybackIndex++;
		if (this.#currentPlaybackIndex >= this.#categoryPlaybackQueue.length) {
			// All events played
			this.stopCategoryPlayback();
			return false;
		}

		const nextEvent = this.#categoryPlaybackQueue[this.#currentPlaybackIndex];
		this.#currentTime = nextEvent.timestamp.start;
		return true;
	}
	//#endregion
}
