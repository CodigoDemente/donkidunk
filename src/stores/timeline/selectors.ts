import { derived } from 'svelte/store';
import { timelineStore } from './store';
import type { RangeData, RangeDataWithTags } from './types';

const timelineEventsByCategory = derived(timelineStore, ($timelineStore) => {
	return $timelineStore.eventTimeline.reduce(
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

const timelineActionsByCategory = derived(timelineStore, ($timelineStore) => {
	return $timelineStore.actionTimeline.reduce(
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

export const selectorsTimeline = {
	timelineEventsByCategory,
	timelineActionsByCategory
};
