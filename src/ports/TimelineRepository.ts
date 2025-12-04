import type { ExportingRule } from '../modules/export/types';
import type { RangeDataWithTags } from '../modules/videoplayer/types/RangeData';

export interface TimelineRepository {
	getEvents(): Promise<RangeDataWithTags[]>;
	getRangesForExport(rules: ExportingRule[]): Promise<[number, number][]>;
	addEntry(
		buttonId: number,
		categoryId: number,
		startTime: number,
		endTime?: number
	): Promise<number>;
	updateEntryEndTime(entryId: number, endTime: number): Promise<void>;
	addTagToEntry(entryId: number, tagId: number): Promise<void>;
	removeTagFromEntry(entryId: number, tagId: number): Promise<void>;
	removeEntry(entryId: number): Promise<void>;
}
