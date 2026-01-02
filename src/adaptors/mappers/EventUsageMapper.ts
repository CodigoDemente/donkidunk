import type { DatabaseEventUsage } from '../types/DatabaseEventUsage';
import type { EventUsage } from '../../modules/metrics/types/EventUsage';
import { CategoryUsageMapper } from './CategoryUsageMapper';

export class EventUsageMapper {
	static toDomain(data: DatabaseEventUsage): EventUsage {
		return {
			id: data.id,
			name: data.name,
			category: CategoryUsageMapper.toDomain({
				id: data.category_id,
				name: data.category_name,
				color: data.category_color
			}),
			color: data.color,
			count: data.count
		};
	}
}
