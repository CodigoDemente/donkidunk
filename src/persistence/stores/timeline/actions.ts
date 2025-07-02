import { emit } from '@tauri-apps/api/event';
import { TimelineRepositoryFactory } from '../../../factories/TimelineRepositoryFactory';
import TimelineStore from './store.svelte';
import type { RangeData, RangeDataWithTags } from './types/RangeData';

const createNewEvent = (
	buttonId: number,
	categoryId: number,
	timeCursor: number
): RangeDataWithTags => {
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
};

export const timelineActions = {
	async addEvent(buttonId: number, categoryId: number, timeCursor: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		const newEvent = createNewEvent(buttonId, categoryId, timeCursor);

		if (TimelineStore.onPlay === null) {
			TimelineStore.onPlay = newEvent;
			TimelineStore.eventSelected = null; // Clear any selected event
			return;
		}
		if (
			TimelineStore.onPlay &&
			TimelineStore.onPlay.buttonId === buttonId &&
			TimelineStore.onPlay.categoryId === categoryId
		) {
			TimelineStore.onPlay.timestamp.end = timeCursor;

			const newEvent = TimelineStore.onPlay;

			const newEventId = await repository.addEntry(
				newEvent.buttonId,
				newEvent.categoryId,
				'event',
				newEvent.timestamp.start,
				newEvent.timestamp.end
			);

			TimelineStore.onPlay.id = newEventId;

			TimelineStore.eventTimeline.push(TimelineStore.onPlay);
			TimelineStore.eventSelected = TimelineStore.onPlay.id;
			TimelineStore.onPlay = null;
			return;
		}

		await emit('project:dirty');
	},

	async addAction(buttonId: number, categoryId: number, timeCursor: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		const actionInAction = TimelineStore.actionTimeline.find(
			(a) => a.buttonId === buttonId && a.categoryId === categoryId && a.timestamp.end === undefined
		);

		if (actionInAction) {
			await repository.updateEntryEndTime(actionInAction.id, timeCursor);
			actionInAction.timestamp.end = timeCursor;
		} else {
			TimelineStore.eventSelected = null; // Clear any selected event

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
				'action',
				newAction.timestamp.start,
				undefined
			);

			newAction.id = newActionId;

			TimelineStore.actionTimeline.push(newAction);
		}

		await emit('project:dirty');
	},

	setEventSelected(eventId: number) {
		if (TimelineStore.eventSelected === eventId) {
			TimelineStore.eventSelected = null;
		} else {
			TimelineStore.eventSelected = eventId;
		}
	},

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

		if (TimelineStore.onPlay) {
			TimelineStore.onPlay = {
				...TimelineStore.onPlay,
				tagsRelated: toggleTag(TimelineStore.onPlay.tagsRelated)
			};
		} else if (TimelineStore.eventSelected) {
			TimelineStore.eventTimeline = TimelineStore.eventTimeline.map((event) =>
				event.id === TimelineStore.eventSelected
					? { ...event, tagsRelated: toggleTag(event.tagsRelated) }
					: event
			);
		}

		if (TimelineStore.onPlay || TimelineStore.eventSelected) {
			if (op === 'add') {
				await repository.addTagToEntry(
					TimelineStore.eventSelected || TimelineStore.onPlay!.id,
					tagId
				);
			} else {
				await repository.removeTagFromEntry(
					TimelineStore.eventSelected || TimelineStore.onPlay!.id,
					tagId
				);
			}
		}

		await emit('project:dirty');
	},

	async removeEvent(eventId: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		TimelineStore.eventTimeline = TimelineStore.eventTimeline.filter((e) => e.id !== eventId);

		await repository.removeEntry(eventId);

		await emit('project:dirty');
	},

	async removeAction(actionId: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		TimelineStore.actionTimeline = TimelineStore.actionTimeline.filter((a) => a.id !== actionId);

		await repository.removeEntry(actionId);

		await emit('project:dirty');
	},

	setOnPlay(event: RangeDataWithTags | null) {
		TimelineStore.onPlay = event;
	}
};
