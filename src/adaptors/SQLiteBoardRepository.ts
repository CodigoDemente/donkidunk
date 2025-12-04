import type Database from '@tauri-apps/plugin-sql';
import type { BoardRepository } from '../ports/BoardRepository';
import type { Category } from '../modules/board/types/Category';
import type { Tag } from '../modules/board/types/Tag';
import type { DatabaseTag } from './types/DatabaseTag';
import { ButtonRange, type Button } from '../modules/board/types/Button';
import { CategoryType } from '../components/box/types';
import type { DatabaseEventCategory, DatabaseTagCategory } from './types/DatabaseCategory';

export class SQLiteBoardRepository implements BoardRepository {
	constructor(private readonly db: Database) {}

	async getSectionCategories(section: CategoryType): Promise<Category[]> {
		if (section === CategoryType.Event) {
			return this.getEventCategories();
		} else if (section === CategoryType.Tag) {
			return this.getTagCategories();
		}
		throw new Error(`Invalid section: ${section}`);
	}

	private async getEventCategories(): Promise<Category[]> {
		const categories = await this.db.select<DatabaseEventCategory[]>(
			`SELECT category.id, type, category.name, category.color, grid_position_x, grid_position_y, button.id AS button_id, button.name AS button_name, button.range as button_range, button.duration as button_duration, button.before as button_before, button.color as button_color
			FROM category LEFT JOIN button ON category.id = button.category_id
             WHERE type = $1
             ORDER BY grid_position_y, grid_position_x`,
			[CategoryType.Event]
		);

		const categoriesAndButtons: Record<string, Category> = categories.reduce(
			(acc, category) => {
				if (!acc[category.id]) {
					acc[category.id] = {
						id: category.id,
						type: category.type as CategoryType,
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
								color: category.button_color
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
						color: category.button_color
					});
				}
				return acc;
			},
			{} as Record<string, Category>
		);

		return Object.values(categoriesAndButtons);
	}

	private async getTagCategories(): Promise<Category[]> {
		const categories = await this.db.select<DatabaseTagCategory[]>(
			`SELECT category.id, type, category.name, category.color, grid_position_x, grid_position_y, tag.id AS tag_id, tag.name AS tag_name, tag.color as tag_color
			FROM category LEFT JOIN tag ON category.id = tag.category_id
             WHERE type = $1
             ORDER BY grid_position_y, grid_position_x`,
			[CategoryType.Tag]
		);

		const categoriesAndTags: Record<string, Category> = categories.reduce(
			(acc, category) => {
				if (!acc[category.id]) {
					acc[category.id] = {
						id: category.id,
						type: category.type as CategoryType,
						name: category.name,
						color: category.color,
						position: { x: category.grid_position_x, y: category.grid_position_y },
						buttons: [
							{
								id: category.tag_id,
								name: category.tag_name,
								color: category.tag_color
							} as Tag
						]
					};
				} else {
					(acc[category.id].buttons as Tag[]).push({
						id: category.tag_id,
						name: category.tag_name,
						color: category.tag_color
					});
				}
				return acc;
			},
			{} as Record<string, Category>
		);

		return Object.values(categoriesAndTags);
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

	async deleteCategory(categoryId: number): Promise<void> {
		await this.db.execute(`DELETE FROM category WHERE id = $1`, [categoryId]);
	}

	async addButtonToCategory(categoryId: number, button: Button): Promise<number> {
		const result = await this.db.execute(
			`INSERT INTO button (name, range, duration, before, color, category_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
			[button.name, button.range, button.duration, button.before, button.color, categoryId]
		);
		return result.lastInsertId!;
	}

	async addTagToCategory(categoryId: number, tag: Tag): Promise<number> {
		const result = await this.db.execute(
			`INSERT INTO tag (name, color, category_id) VALUES ($1, $2, $3)`,
			[tag.name, tag.color, categoryId]
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

	async updateCategoryButtons(categoryId: number, buttons: Button[]): Promise<number[]> {
		// Start a transaction to ensure data integrity
		await this.db.execute('BEGIN TRANSACTION');

		const insertedIds: number[] = [];

		try {
			const fullInsertQuery =
				'INSERT INTO button (name, range, duration, before, color, category_id) VALUES ($1, $2, $3, $4, $5, $6)';
			const fullUpdateQuery =
				'UPDATE button SET name = $1, range = $2, duration = $3, before = $4, color = $5 WHERE id = $6';

			for (const button of buttons) {
				if (button.id && button.id > -1) {
					await this.db.execute(fullUpdateQuery, [
						button.name,
						'range' in button ? button.range : null,
						'duration' in button ? button.duration : null,
						'before' in button ? button.before : null,
						button.color,
						button.id
					]);
				} else {
					const result = await this.db.execute(fullInsertQuery, [
						button.name,
						'range' in button ? button.range!.valueOf() : null,
						'duration' in button ? button.duration : null,
						'before' in button ? button.before : null,
						button.color,
						categoryId
					]);

					insertedIds.push(result.lastInsertId!);
				}
			}
		} catch (error) {
			// If an error occurs, rollback the transaction
			await this.db.execute('ROLLBACK');
			throw error;
		}

		// If everything is successful, commit the transaction
		await this.db.execute('COMMIT');

		return insertedIds;
	}

	async updateCategoryTags(categoryId: number, tags: Tag[]): Promise<number[]> {
		await this.db.execute('BEGIN TRANSACTION');

		const insertedIds: number[] = [];

		try {
			const fullInsertQuery = 'INSERT INTO tag (name, color, category_id) VALUES ($1, $2, $3)';
			const fullUpdateQuery = 'UPDATE tag SET name = $1, color = $2 WHERE id = $3';

			for (const tag of tags) {
				if (tag.id && tag.id > -1) {
					await this.db.execute(fullUpdateQuery, [tag.name, tag.color, tag.id]);
				} else {
					const result = await this.db.execute(fullInsertQuery, [tag.name, tag.color, categoryId]);
					insertedIds.push(result.lastInsertId!);
				}
			}
		} catch (error) {
			await this.db.execute('ROLLBACK');
			throw error;
		}

		await this.db.execute('COMMIT');
		return insertedIds;
	}
}
