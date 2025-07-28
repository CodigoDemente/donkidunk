import type { TimelineData } from './types/Timeline';

const initialState: TimelineData = {
	onPlay: null,
	eventSelected: null,
	eventTimeline: [],
	actionTimeline: []
};

let timelineStore = $state<TimelineData>(initialState);

export default class TimelineStore {
	static get state(): TimelineData {
		return timelineStore;
	}

	static set state(newState: TimelineData) {
		timelineStore = newState;
	}

	static reset() {
		timelineStore = initialState;
	}
}
