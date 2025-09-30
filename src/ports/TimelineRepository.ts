import type { CategoryType } from '../components/box/types';
import type { RangeData, RangeDataWithTags } from '../modules/videoplayer/types/RangeData';

export interface TimelineRepository {
	getEvents(): Promise<RangeDataWithTags[]>;
	getActions(): Promise<RangeData[]>;
	addEntry(
		buttonId: number,
		categoryId: number,
		type: CategoryType,
		startTime: number,
		endTime?: number
	): Promise<number>;
	updateEntryEndTime(entryId: number, endTime: number): Promise<void>;
	addTagToEntry(entryId: number, tagId: number): Promise<void>;
	removeTagFromEntry(entryId: number, tagId: number): Promise<void>;
	removeEntry(entryId: number): Promise<void>;
}
