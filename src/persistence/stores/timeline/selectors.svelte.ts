import { timelineStore } from './store.svelte';
import type { RangeData, RangeDataWithTags } from './types';

const timelineEventsByCategory = $derived.by(() => {
	return timelineStore.eventTimeline.reduce(
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

const timelineActionsByCategory = $derived.by(() => {
	return timelineStore.actionTimeline.reduce(
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

const timelineOnPlay = $derived.by(() => {
	return timelineStore.onPlay;
});

const timelineSelectedEvent = $derived.by(() => {
	return timelineStore.eventSelected;
});

export const selectorsTimeline = {
	timelineEventsByCategory,
	timelineActionsByCategory,
	timelineOnPlay,
	timelineSelectedEvent
};
