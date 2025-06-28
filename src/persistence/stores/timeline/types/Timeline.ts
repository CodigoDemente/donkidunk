import type { RangeData, RangeDataWithTags } from './RangeData';

export type TimelineData = {
	onPlay: null | RangeDataWithTags;
	eventSelected: null | number;
	eventTimeline: RangeDataWithTags[];
	actionTimeline: RangeData[];
};
