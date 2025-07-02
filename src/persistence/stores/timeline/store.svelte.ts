import type { TimelineData } from './types/Timeline';

const initialState: TimelineData = {
	onPlay: null,
	eventSelected: null,
	eventTimeline: [],
	actionTimeline: []
};

const timelineStore = $state<TimelineData>(initialState);

export default timelineStore;
