import TimelineStore from './store.svelte';
import type { RangeDataWithTags } from './types/RangeData';

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
			end: null // Assuming end is null for new events
		},
		tagsRelated: []
	};
};

export const timelineActions = {
	addEvent(buttonId: number, categoryId: number, timeCursor: number) {
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
			TimelineStore.eventTimeline.push(TimelineStore.onPlay);
			TimelineStore.eventSelected = TimelineStore.onPlay.id;
			TimelineStore.onPlay = null;
			return;
		}
	},

	addAction(buttonId: number, categoryId: number, timeCursor: number) {
		const actionInAction = TimelineStore.actionTimeline.find(
			(a) => a.buttonId === buttonId && a.categoryId === categoryId && a.timestamp.end === null
		);

		if (actionInAction) {
			actionInAction.timestamp.end = timeCursor;
		} else {
			TimelineStore.eventSelected = null; // Clear any selected event
			TimelineStore.actionTimeline.push({
				id: Math.floor(Math.random() * 1000),
				buttonId: buttonId,
				categoryId: categoryId,
				timestamp: {
					start: timeCursor,
					end: null // Assuming end is null for new actions
				}
			});
		}
	},

	setEventSelected(eventId: number) {
		if (TimelineStore.eventSelected === eventId) {
			TimelineStore.eventSelected = null;
		} else {
			TimelineStore.eventSelected = eventId;
		}
		console.log('Event selected:', TimelineStore);
	},

	addRelatedTagToEvent(tagId: number) {
		// Helper to toggle a tag in a tagsRelated array
		const toggleTag = (tags: number[]) =>
			tags.includes(tagId) ? tags.filter((tag) => tag !== tagId) : [...tags, tagId];
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
	},

	removeEvent(eventId: number) {
		TimelineStore.eventTimeline = TimelineStore.eventTimeline.filter((e) => e.id !== eventId);
	},

	removeAction(actionId: number) {
		TimelineStore.actionTimeline = TimelineStore.actionTimeline.filter((a) => a.id !== actionId);
	},

	setOnPlay(event: RangeDataWithTags | null) {
		TimelineStore.onPlay = event;
	}
};
