import { makeStoreProxy, StoreScope } from '..';
import type { TimelineData } from './types/Timeline';

const initialState: TimelineData = {
	onPlay: null,
	eventSelected: null,
	eventTimeline: [
		{
			id: '1',
			buttonId: '345',
			categoryId: '1',
			timestamp: {
				start: 10.0,
				end: 120.0
			},
			tagsRelated: ['14-5', '14-6']
		},
		{
			id: '2',
			buttonId: '345',
			categoryId: '1',
			timestamp: {
				start: 900.0,
				end: 1200.0
			},
			tagsRelated: ['14-7']
		}
	],
	actionTimeline: [
		{
			id: '3',
			buttonId: '15-1',
			categoryId: '15',
			timestamp: {
				start: 101.0,
				end: 202.0
			}
		},
		{
			id: '4',
			buttonId: '15-1',
			categoryId: '15',
			timestamp: {
				start: 202.0,
				end: 245.0
			}
		},
		{
			id: '5',
			buttonId: '15-2',
			categoryId: '15',
			timestamp: {
				start: 345.0,
				end: 380.0
			}
		},
		{
			id: '6',
			buttonId: '14-5',
			categoryId: '14',
			timestamp: {
				start: 13.0,
				end: 15.0
			}
		},
		{
			id: '7',
			buttonId: '14-5',
			categoryId: '14',
			timestamp: {
				start: 20.0,
				end: 25.0
			}
		}
	]
};

const timelineStore = $state<TimelineData>(initialState);

export default makeStoreProxy(timelineStore, StoreScope.TIMELINE);
