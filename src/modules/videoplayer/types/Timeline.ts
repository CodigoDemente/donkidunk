import type { RangeData, RangeDataWithTags } from './RangeData';

export type TimelineData = {
	eventTimeline: RangeDataWithTags[];
	actionTimeline: RangeData[];
};
