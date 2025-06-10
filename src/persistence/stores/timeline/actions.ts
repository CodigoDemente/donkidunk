import { timelineStore } from './store.svelte';
import type { RangeDataWithTags } from './types';

// Helper to generate unique IDs
function uuid() {
	return Math.random().toString(36).substring(2, 10) + Date.now();
}

const createNewEvent = (
	buttonId: string,
	categoryId: string,
	timeCursor: number
): RangeDataWithTags => {
	return {
		id: uuid(),
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
	addEvent(buttonId: string, categoryId: string, timeCursor: number) {
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
			timelineStore.eventTimeline.push(timelineStore.onPlay);
			timelineStore.eventSelected = timelineStore.onPlay.id;
			timelineStore.onPlay = null;
			return;
		}
	},

	addAction(buttonId: string, categoryId: string, timeCursor: number) {
		const actionInAction = timelineStore.actionTimeline.find(
			(a) => a.buttonId === buttonId && a.categoryId === categoryId && a.timestamp.end === null
		);

		if (actionInAction) {
			actionInAction.timestamp.end = timeCursor;
		} else {
			timelineStore.eventSelected = null; // Clear any selected event
			timelineStore.actionTimeline.push({
				id: uuid(),
				buttonId: buttonId,
				categoryId: categoryId,
				timestamp: {
					start: timeCursor,
					end: null // Assuming end is null for new actions
				}
			});
		}
	},

	setEventSelected(eventId: string) {
		if (timelineStore.eventSelected === eventId) {
			timelineStore.eventSelected = null;
		} else {
			timelineStore.eventSelected = eventId;
		}
		console.log('Event selected:', timelineStore);
	},

	addRelatedTagToEvent(tagId: string) {
		// Helper to toggle a tag in a tagsRelated array
		const toggleTag = (tags: string[]) =>
			tags.includes(tagId) ? tags.filter((tag) => tag !== tagId) : [...tags, tagId];
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
	},

	removeEvent(eventId: string) {
		timelineStore.eventTimeline = timelineStore.eventTimeline.filter((e) => e.id !== eventId);
	},

	removeAction(actionId: string) {
		timelineStore.actionTimeline = timelineStore.actionTimeline.filter((a) => a.id !== actionId);
	},

	setOnPlay(event: RangeDataWithTags | null) {
		timelineStore.onPlay = event;
	}
};
