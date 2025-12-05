import type { Category } from '../../modules/board/types/Category';
import type { DatabaseCategory } from '../types/DatabaseCategory';

export class CategoryMapper {
	static toPersistence(category: Category): DatabaseCategory {
		return {
			id: category.id,
			name: category.name,
			color: category.color,
			grid_position_x: category.position.x,
			grid_position_y: category.position.y,
			type: category.type
		};
	}
}
