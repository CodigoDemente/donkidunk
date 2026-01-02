import type Database from '@tauri-apps/plugin-sql';
import type { DashboardRepository } from '../ports/DashboardRepository';
import type { EventUsage } from '../modules/metrics/types/EventUsage';
import type { TagUsage } from '../modules/metrics/types/TagUsage';
import type { DatabaseEventUsage } from './types/DatabaseEventUsage';
import type { DatabaseTagUsage } from './types/DatabaseTagUsage';
import { EventUsageMapper } from './mappers/EventUsageMapper';
import { TagUsageMapper } from './mappers/TagUsageMapper';

export class SQLiteDashboardRepository implements DashboardRepository {
	constructor(private readonly db: Database) {}

	async getEventsUsed(): Promise<EventUsage[]> {
		const events = await this.db.select<DatabaseEventUsage[]>(
			`SELECT e.id, e.name, e.category_id, cat.name as category_name, cat.color as category_color, e.color, COUNT(te.id) AS count
			 FROM button e LEFT JOIN timeline_entry te ON e.id = te.button_id
			 LEFT JOIN category cat ON e.category_id = cat.id
			 GROUP BY e.id
			 ORDER BY count DESC`
		);

		return events.map(EventUsageMapper.toDomain);
	}

	async getTagsUsed(): Promise<TagUsage[]> {
		const tags = await this.db.select<DatabaseTagUsage[]>(
			`SELECT t.id, t.name, t.color, t.category_id, cat.name as category_name, cat.color as category_color, COUNT(tet.tag_id) AS count
			 FROM tag t LEFT JOIN timeline_entry_tag tet ON t.id = tet.tag_id
			 LEFT JOIN category cat ON t.category_id = cat.id
			 GROUP BY t.id
			 ORDER BY count DESC`
		);

		return tags.map(TagUsageMapper.toDomain);
	}
}
