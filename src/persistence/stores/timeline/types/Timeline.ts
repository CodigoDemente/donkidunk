import type { RangeData, RangeDataWithTags } from './RangeData';

export type TimelineData = {
	onPlay: null | RangeDataWithTags;
	eventSelected: null | string;
	eventTimeline: RangeDataWithTags[];
	actionTimeline: RangeData[];
};
