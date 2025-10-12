import type Database from '@tauri-apps/plugin-sql';
import type { TimelineRepository } from '../ports/TimelineRepository';
import type { DatabaseEntryWithTag } from './types/DatabaseEntryWithTags';
import type { RangeData, RangeDataWithTags } from '../modules/videoplayer/types/RangeData';
import { CategoryType } from '../components/box/types';

export class SQLiteTimelineRepository implements TimelineRepository {
	constructor(private readonly db: Database) {}

	async getEvents(): Promise<RangeDataWithTags[]> {
		const entries = await this.db.select<DatabaseEntryWithTag[]>(
			`SELECT te.id, te.button_id, te.category_id, te.type, te.timestamp_start, te.timestamp_end, tet.tag_id
			 FROM timeline_entry te LEFT JOIN timeline_entry_tag tet ON te.id = tet.timeline_entry_id
			 WHERE te.type = 'event'`
		);

		const categoriesAndButtons: Record<string, RangeDataWithTags> = entries.reduce(
			(acc, entry) => {
				if (!acc[entry.id]) {
					let tagsRelated: number[] = [];
					if (entry.tag_id) {
						tagsRelated = [entry.tag_id];
					}

					acc[entry.id] = {
						id: entry.id,
						buttonId: entry.button_id,
						categoryId: entry.category_id,
						timestamp: {
							start: entry.timestamp_start,
							end: entry.timestamp_end ?? undefined
						},
						tagsRelated: tagsRelated
					};
				} else if (entry.tag_id) {
					acc[entry.id].tagsRelated.push(entry.tag_id);
				}
				return acc;
			},
			{} as Record<string, RangeDataWithTags>
		);

		return Object.values(categoriesAndButtons);
	}

	async getActions(): Promise<RangeData[]> {
		const entries = await this.db.select<DatabaseEntryWithTag[]>(
			`SELECT id, button_id, category_id, type, timestamp_start, timestamp_end
			 FROM timeline_entry
			 WHERE type = '${CategoryType.Action}'`
		);

		return entries.map((entry) => ({
			id: entry.id,
			buttonId: entry.button_id,
			categoryId: entry.category_id,
			timestamp: {
				start: entry.timestamp_start,
				end: entry.timestamp_end ?? undefined
			}
		}));
	}

	async addEntry(
		buttonId: number,
		categoryId: number,
		type: CategoryType,
		startTime: number,
		endTime: number
	): Promise<number> {
		const result = await this.db.execute(
			`INSERT INTO timeline_entry (button_id, category_id, type, timestamp_start, timestamp_end)
             VALUES ($1, $2, $3, $4, $5)`,
			[buttonId, categoryId, type, startTime, endTime]
		);

		return result.lastInsertId!;
	}

	async updateEntryEndTime(entryId: number, endTime: number): Promise<void> {
		await this.db.execute(`UPDATE timeline_entry SET timestamp_end = $1 WHERE id = $2`, [
			endTime,
			entryId
		]);
	}

	async addTagToEntry(entryId: number, tagId: number): Promise<void> {
		await this.db.execute(
			`INSERT INTO timeline_entry_tag (timeline_entry_id, tag_id) VALUES ($1, $2)`,
			[entryId, tagId]
		);
	}

	async removeTagFromEntry(entryId: number, tagId: number): Promise<void> {
		await this.db.execute(
			`DELETE FROM timeline_entry_tag WHERE timeline_entry_id = $1 AND tag_id = $2`,
			[entryId, tagId]
		);
	}

	async removeEntry(entryId: number): Promise<void> {
		await this.db.execute(`DELETE FROM timeline_entry WHERE id = $1`, [entryId]);
	}
}
