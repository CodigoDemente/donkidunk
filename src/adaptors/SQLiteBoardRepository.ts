import type Database from '@tauri-apps/plugin-sql';
import type { BoardRepository } from '../ports/BoardRepository';
import type { Category } from '../modules/board/types/Category';
import type { DatabaseCategory } from './types/DatabaseCategory';
import type { Tag } from '../modules/board/types/Tag';
import type { DatabaseTag } from './types/DatabaseTag';
import { ButtonRange, type Button } from '../modules/board/types/Button';
import type { CategoryType } from '../components/box/types';

export class SQLiteBoardRepository implements BoardRepository {
	constructor(private readonly db: Database) {}

	async getSectionCategories(section: CategoryType): Promise<Category[]> {
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
								range: ButtonRange[category.button_range as keyof typeof ButtonRange],
								duration: category.button_duration,
								before: category.button_before,
								temp: false
							}
						]
					};
				} else {
					acc[category.id].buttons.push({
						id: category.button_id,
						name: category.button_name,
						range: ButtonRange[category.button_range as keyof typeof ButtonRange],
						duration: category.button_duration,
						before: category.button_before,
						temp: false
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

	async addCategory(section: CategoryType, name: string, color: string): Promise<number> {
		const result = await this.db.execute(
			`INSERT INTO category (type, name, color, grid_position_x, grid_position_y)
             VALUES ($1, $2, $3, 0, 0)`,
			[section, name, color]
		);

		return result.lastInsertId!;
	}

	async addButtonToCategory(categoryId: number, button: Button): Promise<number> {
		const result = await this.db.execute(
			`INSERT INTO button (name, range, duration, before, category_id)
             VALUES ($1, $2, $3, $4, $5)`,
			[button.name, button.range, button.duration, button.before, categoryId]
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

	async updateCategory(categoryId: number, categoryName: string, color: string): Promise<void> {
		await this.db.execute(
			`UPDATE category
			 SET name = $1, color = $2
			 WHERE id = $3`,
			[categoryName, color, categoryId]
		);
	}

	async updateCategoryButtons(categoryId: number, buttons: Button[]): Promise<void> {
		// Start a transaction to ensure data integrity
		await this.db.execute('BEGIN TRANSACTION');

		try {
			// Delete existing buttons for the category
			await this.db.execute('DELETE FROM button WHERE category_id = $1', [categoryId]);

			const fullQuery = `INSERT INTO button (name, range, duration, before, category_id) VALUES `;
			const values: string[] = [];
			const params: (string | number | null)[] = [];

			buttons.forEach((button, index) => {
				const paramIndex = index * 5;
				values.push(
					`($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`
				);
				params.push(
					button.name,
					button.range!.valueOf(),
					button.duration,
					button.before,
					categoryId
				);
			});

			if (values.length > 0) {
				const query = fullQuery + values.join(', ');
				await this.db.execute(query, params);
			}
		} catch (error) {
			// If an error occurs, rollback the transaction
			await this.db.execute('ROLLBACK');
			throw error;
		}

		// If everything is successful, commit the transaction
		await this.db.execute('COMMIT');
	}
}
