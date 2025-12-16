import type { Category } from '../../modules/board/types/Category';
import type { DatabaseCategory } from '../types/DatabaseCategory';

export class CategoryMapper {
	static toDomain(category: DatabaseCategory): Category {
		return {
			id: category.id,
			name: category.name,
			color: category.color,
			position: { x: category.grid_position_x, y: category.grid_position_y },
			size:
				category.width && category.height
					? { width: category.width, height: category.height }
					: undefined,
			type: category.type,
			buttons: []
		};
	}

	static toPersistence(category: Category): DatabaseCategory {
		return {
			id: category.id,
			name: category.name,
			color: category.color,
			grid_position_x: category.position.x,
			grid_position_y: category.position.y,
			width: category.size?.width ?? null,
			height: category.size?.height ?? null,
			type: category.type
		};
	}
}
