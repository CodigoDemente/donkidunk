import type Database from '@tauri-apps/plugin-sql';
import type { TimelineRepository } from '../ports/TimelineRepository';
import type { DatabaseEntryWithTag } from './types/DatabaseEntryWithTags';
import type { RangeData, RangeDataWithTags } from '../modules/videoplayer/types/RangeData';
import type { ExportingRule, GalleryClip } from '../modules/export/types';
import { EntryMapper } from './mappers/EntryMapper';

export class SQLiteTimelineRepository implements TimelineRepository {
	constructor(private readonly db: Database) {}

	async getEvents(): Promise<RangeDataWithTags[]> {
		const entries = await this.db.select<DatabaseEntryWithTag[]>(
			`SELECT te.id, te.button_id, te.category_id, te.timestamp_start, te.timestamp_end, tet.tag_id
			 FROM timeline_entry te LEFT JOIN timeline_entry_tag tet ON te.id = tet.timeline_entry_id`
		);

		const categoriesAndButtons: Record<string, RangeDataWithTags> = entries.reduce(
			(acc, entry) => {
				if (!acc[entry.id]) {
					acc[entry.id] = EntryMapper.toDomainWithTags(entry);
				} else if (entry.tag_id) {
					acc[entry.id].tagsRelated.push(entry.tag_id);
				}
				return acc;
			},
			{} as Record<string, RangeDataWithTags>
		);

		return Object.values(categoriesAndButtons);
	}

	async getClipsForGallery(rules: ExportingRule[]): Promise<GalleryClip[]> {
		function buildCondition(rule: ExportingRule): string {
			let condition = `(t.button_id = '${rule.include}'`;
			if (rule.taggedWith.length > 0) {
				condition += ` AND tt.tag_id IN ('${rule.taggedWith.join("','")}')`;
			}
			return condition + ')';
		}

		type ExportRow = {
			timestamp_start: number;
			timestamp_end: number;
			button_id: string;
			tag_ids: string | null;
		};

		const allQueries = rules.map((rule) => {
			const query = `SELECT
				t.timestamp_start,
				t.timestamp_end,
				t.button_id,
				(SELECT GROUP_CONCAT(tet2.tag_id) FROM timeline_entry_tag tet2 WHERE tet2.timeline_entry_id = t.id) as tag_ids
			FROM timeline_entry t
			LEFT JOIN timeline_entry_tag tt ON t.id = tt.timeline_entry_id
			WHERE ${buildCondition(rule)}
			GROUP BY t.id, t.timestamp_start, t.timestamp_end
			ORDER BY t.timestamp_start;`;

			return this.db.select<ExportRow[]>(query);
		});

		const entries = (await Promise.all(allQueries)).flat();

		return entries.map((entry, index): GalleryClip => {
			const clip: GalleryClip = {
				index,
				timestamps: [entry.timestamp_start, entry.timestamp_end],
				buttonId: entry.button_id
			};
			if (entry.tag_ids) {
				clip.tagIds = entry.tag_ids.split(',');
			}
			return clip;
		});
	}

	async addEntry(entry: RangeData): Promise<void> {
		const databaseEntry = EntryMapper.toPersistence(entry);

		await this.db.execute(
			`INSERT INTO timeline_entry (id, button_id, category_id, timestamp_start, timestamp_end)
             VALUES ($1, $2, $3, $4, $5)`,
			[
				databaseEntry.id,
				databaseEntry.button_id,
				databaseEntry.category_id,
				databaseEntry.timestamp_start,
				databaseEntry.timestamp_end
			]
		);
	}

	async updateEntry(entry: RangeData): Promise<void> {
		const databaseEntry = EntryMapper.toPersistence(entry);

		await this.db.execute(
			`UPDATE timeline_entry SET timestamp_start = $1, timestamp_end = $2 WHERE id = $3`,
			[databaseEntry.timestamp_start, databaseEntry.timestamp_end, databaseEntry.id]
		);
	}

	async addTagToEntry(entryId: string, tagId: string): Promise<void> {
		await this.db.execute(
			`INSERT INTO timeline_entry_tag (timeline_entry_id, tag_id) VALUES ($1, $2)`,
			[entryId, tagId]
		);
	}

	async removeTagFromEntry(entryId: string, tagId: string): Promise<void> {
		await this.db.execute(
			`DELETE FROM timeline_entry_tag WHERE timeline_entry_id = $1 AND tag_id = $2`,
			[entryId, tagId]
		);
	}

	async removeEntry(entryId: string): Promise<void> {
		await this.db.execute(`DELETE FROM timeline_entry WHERE id = $1`, [entryId]);
	}

	async clearAllEntries(): Promise<void> {
		await this.db.execute(`DELETE FROM timeline_entry_tag`);
		await this.db.execute(`DELETE FROM timeline_entry`);
	}
}
