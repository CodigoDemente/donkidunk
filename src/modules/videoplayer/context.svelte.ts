import { Context, StateHistory } from 'runed';
import type { TimelineData } from './types/Timeline';
import type { RangeDataWithTags } from './types/RangeData';
import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
import { emit } from '@tauri-apps/api/event';
import { wrapObjectForUndo } from '../../persistence/undo/UndoStateWrapper';
import { Scope } from '../../persistence/undo/types/Scope';

const initialState: TimelineData = {
	eventTimeline: [],
	actionTimeline: []
};

export const timelineContext = new Context<Timeline>('');

export class Timeline {
	#history!: StateHistory<TimelineData>;
	#state = $state<TimelineData>(initialState);
	#eventPlaying = $state<RangeDataWithTags | null>(null);
	#currentTime: number = $state(0);
	#duration: number = $state(0);
	#eventSelected = $state<number | null>(null);
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
		buttonId: number,
		categoryId: number,
		timeCursor: number
	): RangeDataWithTags {
		return {
			id: Math.floor(Math.random() * 1000),
			buttonId: buttonId,
			categoryId: categoryId,
			timestamp: {
				start: timeCursor,
				end: undefined // Assuming end is undefined for new events
			},
			tagsRelated: []
		};
	}

	private async persistEvent(event: RangeDataWithTags) {
		const repository = TimelineRepositoryFactory.getInstance();

		const newEventId = await repository.addEntry(
			event.buttonId,
			event.categoryId,
			event.timestamp.start,
			event.timestamp.end
		);

		event.id = newEventId;
		this.#eventPlaying!.id = newEventId;

		this.#state = {
			...this.#state,
			eventTimeline: [...this.#state.eventTimeline, event]
		};

		this.#eventSelected = newEventId;
		this.#eventPlaying = null;

		await emit('project:dirty');
	}

	//#region Actions
	async addEvent(buttonId: number, categoryId: number, timeCursor: number) {
		const newEvent = this.createNewEvent(buttonId, categoryId, timeCursor);

		if (this.#eventPlaying === null) {
			this.#eventPlaying = newEvent;
			this.#eventSelected = null; // Clear any selected event
			return;
		}
		if (
			this.#eventPlaying &&
			this.#eventPlaying.buttonId === buttonId &&
			this.#eventPlaying.categoryId === categoryId
		) {
			this.#eventPlaying.timestamp.end = timeCursor;

			this.persistEvent(this.#eventPlaying);
		}
	}

	setEventSelected(eventId: number) {
		if (this.#eventSelected === eventId) {
			this.#eventSelected = null;
		} else {
			this.#eventSelected = eventId;
		}
	}

	async addRelatedTagToEvent(tagId: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		let op = 'add';

		// Helper to toggle a tag in a tagsRelated array
		const toggleTag = (tags: number[]) => {
			if (tags.includes(tagId)) {
				op = 'remove';

				return tags.filter((tag) => tag !== tagId);
			}

			return [...tags, tagId];
		};

		if (this.#eventPlaying) {
			this.#eventPlaying = {
				...this.#eventPlaying,
				tagsRelated: toggleTag(this.#eventPlaying.tagsRelated)
			};
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

		if (this.#eventPlaying || this.#eventSelected) {
			if (op === 'add') {
				await repository.addTagToEntry(this.#eventSelected || this.#eventPlaying!.id, tagId);
			} else {
				await repository.removeTagFromEntry(this.#eventSelected || this.#eventPlaying!.id, tagId);
			}
		}

		await emit('project:dirty');
	}

	async removeEvent(eventId: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		const newEventTimeline = this.#state.eventTimeline.filter((e) => e.id !== eventId);
		this.#state = {
			...this.#state,
			eventTimeline: newEventTimeline
		};

		await repository.removeEntry(eventId);

		await emit('project:dirty');
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
