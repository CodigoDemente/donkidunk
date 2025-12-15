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
	eventTimeline: [],
	actionTimeline: []
};

export const timelineContext = new Context<Timeline>('');

export class Timeline {
	#history!: StateHistory<TimelineData>;
	#state = $state<TimelineData>(initialState);
	#eventPlaying = $state<RangeDataWithTags | null>(null);
	#eventsPlaying = $state<SvelteMap<string, RangeDataWithTags>>(new SvelteMap());
	#currentTime: number = $state(0);
	#duration: number = $state(0);
	#eventSelected = $state<string | null>(null);
	#timelineEventsByCategory!: Record<string, RangeDataWithTags[]>;

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

		await repository.addEntry(event);

		this.#state = {
			...this.#state,
			eventTimeline: [...this.#state.eventTimeline, event]
		};

		this.#eventSelected = event.id;
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
			eventPlaying.timestamp.end = timeCursor;

			return await this.persistEvent(eventPlaying);
		}
	}

	setEventSelected(eventId: string) {
		if (this.#eventSelected === eventId) {
			this.#eventSelected = null;
		} else {
			this.#eventSelected = eventId;
		}
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

	//#region Selectors
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
	//#endregion
}
