import { Context, StateHistory } from 'runed';
import type { TimelineData } from './types/Timeline';
import type { RangeData, RangeDataWithTags } from './types/RangeData';
import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
import { emit } from '@tauri-apps/api/event';
import { wrapObjectForUndo } from '../../persistence/undo/UndoStateWrapper';
import { Scope } from '../../persistence/undo/types/Scope';
import { CategoryType } from '../../components/box/types';

const initialState: TimelineData = {
	eventTimeline: [],
	actionTimeline: []
};

export const timelineContext = new Context<Timeline>('');

export class Timeline {
	#history!: StateHistory<TimelineData>;
	#state = $state<TimelineData>(initialState);
	#onPlay = $state<RangeDataWithTags | null>(null);
	#eventSelected = $state<number | null>(null);
	#timelineEventsByCategory!: Record<string, RangeDataWithTags[]>;
	#timelineActionsByCategory!: Record<string, RangeData[]>;

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

		this.#timelineActionsByCategory = $derived.by(() => {
			return this.#state.actionTimeline.reduce(
				(acc, action) => {
					if (!acc[action.categoryId]) {
						acc[action.categoryId] = [];
					}
					acc[action.categoryId].push(action);
					return acc;
				},
				{} as Record<string, RangeData[]>
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
			CategoryType.Event,
			event.timestamp.start,
			event.timestamp.end
		);

		event.id = newEventId;
		this.#onPlay!.id = newEventId;

		this.#state = {
			...this.#state,
			eventTimeline: [...this.#state.eventTimeline, event]
		};

		this.#eventSelected = newEventId;
		this.#onPlay = null;

		await emit('project:dirty');

		return;
	}

	//#region Actions
	async addEvent(buttonId: number, categoryId: number, timeCursor: number) {
		const newEvent = this.createNewEvent(buttonId, categoryId, timeCursor);

		if (this.#onPlay === null) {
			this.#onPlay = newEvent;
			this.#eventSelected = null; // Clear any selected event
			return;
		}
		if (
			this.#onPlay &&
			this.#onPlay.buttonId === buttonId &&
			this.#onPlay.categoryId === categoryId
		) {
			this.#onPlay.timestamp.end = timeCursor;

			this.persistEvent(this.#onPlay);
		}
	}

	async addAction(buttonId: number, categoryId: number, timeCursor: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		const actionInAction = this.#state.actionTimeline.find(
			(a) => a.buttonId === buttonId && a.categoryId === categoryId && a.timestamp.end === undefined
		);

		if (actionInAction) {
			await repository.updateEntryEndTime(actionInAction.id, timeCursor);
			actionInAction.timestamp.end = timeCursor;
			// eslint-disable-next-line no-self-assign
			this.#state = this.#state;
		} else {
			this.#eventSelected = null; // Clear any selected event

			const newAction: RangeData = {
				id: 0, // ID will be set by the database
				buttonId: buttonId,
				categoryId: categoryId,
				timestamp: {
					start: timeCursor,
					end: undefined // Assuming end is undefined for new actions
				}
			};

			const newActionId = await repository.addEntry(
				newAction.buttonId,
				newAction.categoryId,
				CategoryType.Action,
				newAction.timestamp.start,
				undefined
			);

			newAction.id = newActionId;

			this.#state = {
				...this.#state,
				actionTimeline: [...this.#state.actionTimeline, newAction]
			};
		}

		await emit('project:dirty');
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

		if (this.#onPlay) {
			this.#onPlay = {
				...this.#onPlay,
				tagsRelated: toggleTag(this.#onPlay.tagsRelated)
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

		if (this.#onPlay || this.#eventSelected) {
			if (op === 'add') {
				await repository.addTagToEntry(this.#eventSelected || this.#onPlay!.id, tagId);
			} else {
				await repository.removeTagFromEntry(this.#eventSelected || this.#onPlay!.id, tagId);
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

	async removeAction(actionId: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		const newActionTimeline = this.#state.actionTimeline.filter((a) => a.id !== actionId);
		this.#state = {
			...this.#state,
			actionTimeline: newActionTimeline
		};

		await repository.removeEntry(actionId);

		await emit('project:dirty');
	}

	setOnPlay(event: RangeDataWithTags | null) {
		this.#onPlay = event;
	}

	wrapForUndo() {
		Object.assign(
			this,
			wrapObjectForUndo(
				{
					addAction: this.addAction.bind(this),
					persistEvent: this.persistEvent.bind(this),
					addRelatedTagToEvent: this.addRelatedTagToEvent.bind(this),
					removeEvent: this.removeEvent.bind(this),
					removeAction: this.removeAction.bind(this)
				},
				Scope.Timeline
			)
		);

		return this;
	}
	//#endregion

	//#region Selectors
	get onPlay() {
		return this.#onPlay;
	}

	get eventSelected() {
		return this.#eventSelected;
	}

	get eventsByCategory() {
		return this.#timelineEventsByCategory;
	}

	get actionsByCategory() {
		return this.#timelineActionsByCategory;
	}
	//#endregion
}
