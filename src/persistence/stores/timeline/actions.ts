import { emit } from '@tauri-apps/api/event';
import { TimelineRepositoryFactory } from '../../../factories/TimelineRepositoryFactory';
import TimelineStore from './store.svelte';
import type { RangeData, RangeDataWithTags } from './types/RangeData';

const timelineStore = TimelineStore.getState();

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

		if (timelineStore.onPlay === null) {
			timelineStore.onPlay = newEvent;
			timelineStore.eventSelected = null; // Clear any selected event
			return;
		}
		if (
			timelineStore.onPlay &&
			timelineStore.onPlay.buttonId === buttonId &&
			timelineStore.onPlay.categoryId === categoryId
		) {
			timelineStore.onPlay.timestamp.end = timeCursor;

			const newEvent = timelineStore.onPlay;

			const newEventId = await repository.addEntry(
				newEvent.buttonId,
				newEvent.categoryId,
				'event',
				newEvent.timestamp.start,
				newEvent.timestamp.end
			);

			timelineStore.onPlay.id = newEventId;

			timelineStore.eventTimeline.push(timelineStore.onPlay);
			timelineStore.eventSelected = timelineStore.onPlay.id;
			timelineStore.onPlay = null;
			return;
		}

		await emit('project:dirty');
	},

	async addAction(buttonId: number, categoryId: number, timeCursor: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		const actionInAction = timelineStore.actionTimeline.find(
			(a) => a.buttonId === buttonId && a.categoryId === categoryId && a.timestamp.end === undefined
		);

		if (actionInAction) {
			await repository.updateEntryEndTime(actionInAction.id, timeCursor);
			actionInAction.timestamp.end = timeCursor;
		} else {
			timelineStore.eventSelected = null; // Clear any selected event

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

			timelineStore.actionTimeline.push(newAction);
		}

		await emit('project:dirty');
	},

	setEventSelected(eventId: number) {
		if (timelineStore.eventSelected === eventId) {
			timelineStore.eventSelected = null;
		} else {
			timelineStore.eventSelected = eventId;
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

		if (timelineStore.onPlay) {
			timelineStore.onPlay = {
				...timelineStore.onPlay,
				tagsRelated: toggleTag(timelineStore.onPlay.tagsRelated)
			};
		} else if (timelineStore.eventSelected) {
			timelineStore.eventTimeline = timelineStore.eventTimeline.map((event) =>
				event.id === timelineStore.eventSelected
					? { ...event, tagsRelated: toggleTag(event.tagsRelated) }
					: event
			);
		}

		if (timelineStore.onPlay || timelineStore.eventSelected) {
			if (op === 'add') {
				await repository.addTagToEntry(
					timelineStore.eventSelected || timelineStore.onPlay!.id,
					tagId
				);
			} else {
				await repository.removeTagFromEntry(
					timelineStore.eventSelected || timelineStore.onPlay!.id,
					tagId
				);
			}
		}

		await emit('project:dirty');
	},

	async removeEvent(eventId: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		timelineStore.eventTimeline = timelineStore.eventTimeline.filter((e) => e.id !== eventId);

		await repository.removeEntry(eventId);

		await emit('project:dirty');
	},

	async removeAction(actionId: number) {
		const repository = TimelineRepositoryFactory.getInstance();

		timelineStore.actionTimeline = timelineStore.actionTimeline.filter((a) => a.id !== actionId);

		await repository.removeEntry(actionId);

		await emit('project:dirty');
	},

	setOnPlay(event: RangeDataWithTags | null) {
		timelineStore.onPlay = event;
	}
};
