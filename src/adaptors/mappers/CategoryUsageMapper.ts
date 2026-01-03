import type { CategoryUsage } from '../../modules/metrics/types/CategoryUsage';
import type { DatabaseCategoryUsage } from '../types/DatabaseCategoryUsage';

export class CategoryUsageMapper {
	static toDomain(data: DatabaseCategoryUsage): CategoryUsage {
		return {
			id: data.id,
			name: data.name,
			color: data.color
		};
	}
}
