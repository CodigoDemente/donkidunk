import type { RangeData, RangeDataWithTags } from '../modules/videoplayer/types/RangeData';

export interface TimelineRepository {
	getEvents(): Promise<RangeDataWithTags[]>;
	getActions(): Promise<RangeData[]>;
	getRangesForExport(
		eventIds: number[],
		actionIds: number[],
		tagIds: number[]
	): Promise<[number, number][]>;
	addEntry(
		buttonId: number,
		categoryId: number,
		type: 'event' | 'action',
		startTime: number,
		endTime?: number
	): Promise<number>;
	updateEntryEndTime(entryId: number, endTime: number): Promise<void>;
	addTagToEntry(entryId: number, tagId: number): Promise<void>;
	removeTagFromEntry(entryId: number, tagId: number): Promise<void>;
	removeEntry(entryId: number): Promise<void>;
}
