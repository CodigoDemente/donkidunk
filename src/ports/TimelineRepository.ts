import type { ExportingRule } from '../modules/export/types';
import type { RangeData, RangeDataWithTags } from '../modules/videoplayer/types/RangeData';

export interface TimelineRepository {
	getEvents(): Promise<RangeDataWithTags[]>;
	getRangesForExport(rules: ExportingRule[]): Promise<[number, number][]>;
	addEntry(entry: RangeData): Promise<void>;
	updateEntry(entry: RangeData): Promise<void>;
	addTagToEntry(entryId: string, tagId: string): Promise<void>;
	removeTagFromEntry(entryId: string, tagId: string): Promise<void>;
	removeEntry(entryId: string): Promise<void>;
	clearAllEntries(): Promise<void>;
}
