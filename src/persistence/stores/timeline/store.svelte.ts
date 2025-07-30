import type { TimelineData } from './types/Timeline';

const initialState: TimelineData = {
	onPlay: null,
	eventSelected: null,
	eventTimeline: [],
	actionTimeline: []
};

let timelineStore = $state<TimelineData>(initialState);

export default class TimelineStore {
	static getState(): TimelineData {
		return timelineStore;
	}

	static setState(newState: TimelineData) {
		timelineStore = newState;
	}

	static reset() {
		timelineStore = initialState;
	}
}
