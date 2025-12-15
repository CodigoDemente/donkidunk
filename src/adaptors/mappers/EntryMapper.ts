import type { RangeData, RangeDataWithTags } from '../../modules/videoplayer/types/RangeData';
import type { DatabaseEntry, DatabaseEntryWithTag } from '../types/DatabaseEntryWithTags';

export class EntryMapper {
	static toPersistence(entry: RangeData): DatabaseEntry {
		return {
			id: entry.id,
			button_id: entry.buttonId,
			category_id: entry.categoryId,
			timestamp_start: entry.timestamp.start,
			timestamp_end: entry.timestamp.end
		};
	}

	static toDomainWithTags(entry: DatabaseEntryWithTag): RangeDataWithTags {
		return {
			id: entry.id,
			buttonId: entry.button_id,
			categoryId: entry.category_id,
			timestamp: {
				start: entry.timestamp_start,
				end: entry.timestamp_end ?? undefined
			},
			tagsRelated: entry.tag_id ? [entry.tag_id] : []
		};
	}
}
