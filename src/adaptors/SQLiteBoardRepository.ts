import type Database from '@tauri-apps/plugin-sql';
import type { BoardRepository } from '../ports/BoardRepository';
import type { Category } from '../modules/board/types/Category';
import type { DatabaseCategory } from './types/DatabaseCategory';
import type { Tag } from '../modules/board/types/Tag';
import type { DatabaseTag } from './types/DatabaseTag';
import type { Button } from '../modules/board/types/Button';

export class SQLiteBoardRepository implements BoardRepository {
	constructor(private readonly db: Database) {}

	async getSectionCategories(section: 'event' | 'action'): Promise<Category[]> {
		const categories = await this.db.select<DatabaseCategory[]>(
			`SELECT category.id, type, category.name, color, grid_position_x, grid_position_y, button.id AS button_id, button.name AS button_name, button.range as button_range, button.duration as button_duration, button.before as button_before
             FROM category LEFT JOIN button ON category.id = button.category_id
             WHERE type = $1
             ORDER BY grid_position_y, grid_position_x`,
			[section]
		);

		const categoriesAndButtons: Record<string, Category> = categories.reduce(
			(acc, category) => {
				if (!acc[category.id]) {
					acc[category.id] = {
						id: category.id,
						name: category.name,
						color: category.color,
						position: { x: category.grid_position_x, y: category.grid_position_y },
						buttons: [
							{
								id: category.button_id,
								name: category.button_name,
								range: category.button_range,
								duration: category.button_duration,
								before: Boolean(category.button_before)
							}
						]
					};
				} else {
					acc[category.id].buttons.push({
						id: category.button_id,
						name: category.button_name,
						range: category.button_range,
						duration: category.button_duration,
						before: Boolean(category.button_before)
					});
				}
				return acc;
			},
			{} as Record<string, Category>
		);

		return Object.values(categoriesAndButtons);
	}

	async getTagsRelatedToEvents(): Promise<Tag[]> {
		const tags = await this.db.select<DatabaseTag[]>(
			`SELECT id, name, color
             FROM tag`
		);

		return tags.map((tag) => ({
			id: tag.id,
			name: tag.name,
			color: tag.color
		}));
	}

	async addCategory(section: 'event' | 'action', name: string, color: string): Promise<number> {
		const result = await this.db.execute(
			`INSERT INTO category (type, name, color, grid_position_x, grid_position_y)
             VALUES ($1, $2, $3, 0, 0)`,
			[section, name, color]
		);

		return result.lastInsertId!;
	}

	async addTagsList(list: Tag[]): Promise<Tag[]> {
		const resultList: Tag[] = [];

		for (const tag of list) {
			if (tag.id) {
				await this.db.execute(`UPDATE tag SET name = $1, color = $2 WHERE id = $3`, [
					tag.name,
					tag.color,
					tag.id
				]);
				resultList.push(tag);
			} else {
				const result = await this.db.execute(`INSERT INTO tag (name, color) VALUES ($1, $2)`, [
					tag.name,
					tag.color
				]);
				resultList.push({
					...tag,
					id: result.lastInsertId
				});
			}
		}

		return resultList;
	}

	async addButtonToCategory(categoryId: number, button: Button): Promise<number> {
		const result = await this.db.execute(
			`INSERT INTO button (name, range, duration, before, category_id)
             VALUES ($1, $2, $3, $4, $5)`,
			[button.name, button.range, button.duration, Number(button.before), categoryId]
		);
		return result.lastInsertId!;
	}

	async updateCategoryPosition(categoryId: number, x: number, y: number): Promise<void> {
		await this.db.execute(
			`UPDATE category
             SET grid_position_x = $1, grid_position_y = $2
             WHERE id = $3`,
			[x, y, categoryId]
		);
	}

	async updateCategoryName(categoryId: number, categoryName: string): Promise<void> {
		await this.db.execute(
			`UPDATE category
             SET name = $1
             WHERE id = $2`,
			[categoryName, categoryId]
		);
	}
}
