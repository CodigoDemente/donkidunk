import { timelineStore } from './store';
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
		timelineStore.update((state) => {
			const newEvent = createNewEvent(buttonId, categoryId, timeCursor);

			if (state.onPlay === null) {
				state.onPlay = newEvent;
				state.eventSelected = null; // Clear any selected event
				return state;
			}
			if (
				state.onPlay &&
				state.onPlay.buttonId === buttonId &&
				state.onPlay.categoryId === categoryId
			) {
				state.onPlay.timestamp.end = timeCursor;
				state.eventTimeline.push(state.onPlay);
				state.eventSelected = state.onPlay.id;
				state.onPlay = null;
				return state;
			}

			return state;
		});
	},

	addAction(buttonId: string, categoryId: string, timeCursor: number) {
		timelineStore.update((state) => {
			const actionInAction = state.actionTimeline.find(
				(a) => a.buttonId === buttonId && a.categoryId === categoryId && a.timestamp.end === null
			);

			if (actionInAction) {
				actionInAction.timestamp.end = timeCursor;
			} else {
				state.eventSelected = null; // Clear any selected event
				state.actionTimeline.push({
					id: uuid(),
					buttonId: buttonId,
					categoryId: categoryId,
					timestamp: {
						start: timeCursor,
						end: null // Assuming end is null for new actions
					}
				});
			}
			return state;
		});
	},

	setEventSelected(eventId: string) {
		timelineStore.update((state) => {
			if (state.eventSelected === eventId) {
				state.eventSelected = null;
			} else {
				state.eventSelected = eventId;
			}
			console.log('Event selected:', state);
			return state;
		});
	},

	addRelatedTagToEvent(tagId: string) {
		timelineStore.update((state) => {
			// Helper to toggle a tag in a tagsRelated array
			const toggleTag = (tags: string[]) =>
				tags.includes(tagId) ? tags.filter((tag) => tag !== tagId) : [...tags, tagId];
			if (state.onPlay) {
				state.onPlay = {
					...state.onPlay,
					tagsRelated: toggleTag(state.onPlay.tagsRelated)
				};
			} else if (state.eventSelected) {
				state.eventTimeline = state.eventTimeline.map((event) =>
					event.id === state.eventSelected
						? { ...event, tagsRelated: toggleTag(event.tagsRelated) }
						: event
				);
			}
			return state;
		});
	},

	removeEvent(eventId: string) {
		timelineStore.update((state) => {
			state.eventTimeline = state.eventTimeline.filter((e) => e.id !== eventId);
			return state;
		});
	},

	removeAction(actionId: string) {
		timelineStore.update((state) => {
			state.actionTimeline = state.actionTimeline.filter((a) => a.id !== actionId);
			return state;
		});
	},

	setOnPlay(event: RangeDataWithTags | null) {
		timelineStore.update((state) => {
			state.onPlay = event;
			return state;
		});
	}
};
