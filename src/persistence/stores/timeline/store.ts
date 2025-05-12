import { writable } from 'svelte/store';
import type { EventsData, TagsData } from './types';

export interface TimelineStore {
	events: EventsData[];
	actions: TagsData[];
}

const initialState: TimelineStore = {
	events: [
		{
			eventCategoryId: '1',
			events: [
				{ eventId: '1-1', timestamp: [10.0, 120.0] },
				{ eventId: '1-2', timestamp: [140.0, 600.0] },
				{ eventId: '1-3', timestamp: [1220.0, 1660.0] }
			]
		},
		{
			eventCategoryId: '2',
			events: [{ eventId: '2-3', timestamp: [900.0, 1200.0] }]
		}
	],
	actions: [
		{
			categoryId: '14',
			tags: [
				{ tagId: '14-5', timestamp: [101.0, 202.0] },
				{ tagId: '14-6', timestamp: [202.0, 245.0] },
				{ tagId: '14-7', timestamp: [345.0, 380.0] }
			]
		},
		{
			categoryId: '13',
			tags: [
				{ tagId: '13-1', timestamp: [13.0, 15.0] },
				{ tagId: '13-2', timestamp: [20.0, 25.0] },
				{ tagId: '13-2', timestamp: [30.0, 35.0] },
				{ tagId: '13-2', timestamp: [40.0, 45.0] },
				{ tagId: '13-2', timestamp: [50.0, 55.0] },
				{ tagId: '13-3', timestamp: [60.0, 65.0] },
				{ tagId: '13-3', timestamp: [70.0, 75.0] },
				{ tagId: '13-3', timestamp: [80.0, 85.0] }
			]
		},
		{
			categoryId: '15',
			tags: [
				{ tagId: '15-1', timestamp: [18.0, 22.0] },
				{ tagId: '15-2', timestamp: [1292.0, 1295.0] },
				{ tagId: '15-3', timestamp: [694.0, 698.0] }
			]
		},
		{
			categoryId: '16',
			tags: [
				{ tagId: '16-1', timestamp: [212.0, 218.0] },
				{ tagId: '16-2', timestamp: [304.0, 308.0] },
				{ tagId: '16-3', timestamp: [412.0, 422.0] }
			]
		},
		{
			categoryId: '17',
			tags: [
				{ tagId: '17-1', timestamp: [11.0, 22.0] },
				{ tagId: '17-2', timestamp: [1292.0, 1493.0] },
				{ tagId: '17-3', timestamp: [678.0, 690.0] }
			]
		}
	]
};

export const timelineStore = writable<TimelineStore>(initialState);
