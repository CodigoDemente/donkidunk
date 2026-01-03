import type { DatabaseTagUsage } from '../types/DatabaseTagUsage';
import type { TagUsage } from '../../modules/metrics/types/TagUsage';
import { CategoryUsageMapper } from './CategoryUsageMapper';

export class TagUsageMapper {
	static toDomain(data: DatabaseTagUsage): TagUsage {
		return {
			id: data.id,
			name: data.name,
			color: data.color,
			category: CategoryUsageMapper.toDomain({
				id: data.category_id,
				name: data.category_name,
				color: data.category_color
			}),
			count: data.count
		};
	}
}
