import TimelineStore from './store.svelte';
import type { RangeData, RangeDataWithTags } from './types/RangeData';

const timelineEventsByCategory = $derived.by(() => {
	return TimelineStore.eventTimeline.reduce(
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
	return TimelineStore.actionTimeline.reduce(
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

const timelineOnPlay = $derived(TimelineStore.onPlay);

const timelineSelectedEvent = $derived(TimelineStore.eventSelected);

export class TimelineSelectors {
	static getEventsByCategory() {
		return timelineEventsByCategory;
	}
	static getActionsByCategory() {
		return timelineActionsByCategory;
	}
	static getOnPlay() {
		return timelineOnPlay;
	}
	static getSelectedEvent() {
		return timelineSelectedEvent;
	}
}
