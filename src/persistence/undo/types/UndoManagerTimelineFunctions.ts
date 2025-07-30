import type { TimelineData } from '../../stores/timeline/types/Timeline';

export type UndoManagerTimelineFunctions = {
	timelineStoreGetter: () => TimelineData;
	timelineStoreSetter: (newState: TimelineData) => void;
};
