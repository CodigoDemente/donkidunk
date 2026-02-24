import type Database from '@tauri-apps/plugin-sql';
import type { BoardRepository } from '../ports/BoardRepository';
import type { Category } from '../modules/board/types/Category';
import type { Tag } from '../modules/board/types/Tag';
import type { DatabaseTag } from './types/DatabaseTag';
import { ButtonRange, type Button } from '../modules/board/types/Button';
import { CategoryType } from '../modules/board/types/CategoryType';
import type {
	DatabaseCategory,
	DatabaseCategoryWithEvent,
	DatabaseCategoryWithTag
} from './types/DatabaseCategory';
import { CategoryMapper } from './mappers/CategoryMapper';
import { ButtonMapper } from './mappers/ButtonMapper';
import { TagMapper } from './mappers/TagMapper';
import { error } from '@tauri-apps/plugin-log';

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

	async categoryExists(categoryId: string): Promise<boolean> {
		const category = await this.db.select<DatabaseCategory[]>(
			`SELECT id FROM category WHERE id = $1`,
			[categoryId]
		);

		return category.length > 0;
	}

	private async getEventCategories(): Promise<Category[]> {
		const categories = await this.db.select<DatabaseCategoryWithEvent[]>(
			`SELECT category.id, type, category.name, category.color, grid_position_x, grid_position_y, category.width, category.height, button.id AS button_id, button.name AS button_name, button.range as button_range, button.duration as button_duration, button.before as button_before, button.color as button_color
			FROM category LEFT JOIN button ON category.id = button.category_id
             WHERE type = $1
             ORDER BY grid_position_y, grid_position_x`,
			[CategoryType.Event]
		);

		const categoriesAndButtons: Record<string, Category> = categories.reduce(
			(acc, category) => {
				if (!acc[category.id]) {
					const c = CategoryMapper.toDomain(category);
					const button: Button = {
						id: category.button_id,
						name: category.button_name,
						range: ButtonRange[category.button_range as keyof typeof ButtonRange],
						duration: category.button_duration,
						before: category.button_before,
						color: category.button_color
					};
					c.buttons.push(button);

					acc[category.id] = c;
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
		const categories = await this.db.select<DatabaseCategoryWithTag[]>(
			`SELECT category.id, type, category.name, category.color, grid_position_x, grid_position_y, category.width, category.height, tag.id AS tag_id, tag.name AS tag_name, tag.color as tag_color
			FROM category LEFT JOIN tag ON category.id = tag.category_id
             WHERE type = $1
             ORDER BY grid_position_y, grid_position_x`,
			[CategoryType.Tag]
		);

		const categoriesAndTags: Record<string, Category> = categories.reduce(
			(acc, category) => {
				if (!acc[category.id]) {
					const c = CategoryMapper.toDomain(category);
					const tag: Tag = {
						id: category.tag_id,
						name: category.tag_name,
						color: category.tag_color
					};
					(c.buttons as Tag[]).push(tag);
					acc[category.id] = c;
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

		return tags.map(TagMapper.toDomain);
	}

	async addCategory(category: Category): Promise<void> {
		const databaseCategory = CategoryMapper.toPersistence(category);

		await this.db.execute(
			`INSERT INTO category (id, type, name, color, grid_position_x, grid_position_y, width, height)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			[
				databaseCategory.id,
				databaseCategory.type,
				databaseCategory.name,
				databaseCategory.color,
				databaseCategory.grid_position_x,
				databaseCategory.grid_position_y,
				databaseCategory.width ?? null,
				databaseCategory.height ?? null
			]
		);
	}

	async deleteCategory(categoryId: string): Promise<void> {
		await this.db.execute(`DELETE FROM category WHERE id = $1`, [categoryId]);
	}

	async addButtonToCategory(categoryId: string, button: Button): Promise<void> {
		const databaseButton = ButtonMapper.toPersistence(button);

		await this.db.execute(
			`INSERT INTO button (id, name, range, duration, before, color, category_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			[
				databaseButton.id,
				databaseButton.name,
				databaseButton.range,
				databaseButton.duration,
				databaseButton.before,
				databaseButton.color,
				categoryId
			]
		);
	}

	async addTagToCategory(categoryId: string, tag: Tag): Promise<void> {
		const databaseTag = TagMapper.toPersistence(tag);

		await this.db.execute(
			`INSERT INTO tag (id, name, color, category_id) VALUES ($1, $2, $3, $4)`,
			[databaseTag.id, databaseTag.name, databaseTag.color, categoryId]
		);
	}

	async updateCategoryPosition(categoryId: string, x: number, y: number): Promise<void> {
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

	async updateCategory(category: Category): Promise<void> {
		const databaseCategory = CategoryMapper.toPersistence(category);

		await this.db.execute(
			`UPDATE category
			 SET name = $1, color = $2, grid_position_x = $3, grid_position_y = $4, width = $5, height = $6
			 WHERE id = $7`,
			[
				databaseCategory.name,
				databaseCategory.color,
				databaseCategory.grid_position_x,
				databaseCategory.grid_position_y,
				databaseCategory.width,
				databaseCategory.height,
				databaseCategory.id
			]
		);
	}

	async updateCategoryButtons(categoryId: string, buttons: Button[]): Promise<void> {
		try {
			let fullInsertQuery =
				'INSERT INTO button (id, name, range, duration, before, color, category_id) VALUES';
			const allValues = [];
			const allArgs = [];
			let index = 1;

			for (const button of buttons) {
				const databaseButton = ButtonMapper.toPersistence(button);

				allArgs.push(
					databaseButton.id,
					databaseButton.name,
					databaseButton.range,
					databaseButton.duration,
					databaseButton.before,
					databaseButton.color,
					categoryId
				);
				allValues.push(
					`($${index++}, $${index++}, $${index++}, $${index++}, $${index++}, $${index++}, $${index++})`
				);
			}

			fullInsertQuery += ` ${allValues.join(',')} ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, range = EXCLUDED.range, duration = EXCLUDED.duration, before = EXCLUDED.before, color = EXCLUDED.color`;

			await this.db.execute(fullInsertQuery, allArgs);
		} catch (err) {
			error(`Error updating category buttons: ${err}`);
			throw err;
		}
	}

	async updateCategoryTags(categoryId: string, tags: Tag[]): Promise<void> {
		try {
			let fullInsertQuery = 'INSERT INTO tag (id, name, color, category_id) VALUES';
			const allValues = [];
			const allArgs = [];
			let index = 1;

			for (const tag of tags) {
				const databaseTag = TagMapper.toPersistence(tag);

				allArgs.push(databaseTag.id, databaseTag.name, databaseTag.color, categoryId);
				allValues.push(`($${index++}, $${index++}, $${index++}, $${index++})`);
			}

			fullInsertQuery += ` ${allValues.join(',')} ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color`;

			await this.db.execute(fullInsertQuery, allArgs);
		} catch (err) {
			error(`Error updating category tags: ${err}`);
			throw err;
		}
	}

	async deleteButtonFromCategory(categoryId: string, buttonId: string): Promise<void> {
		await this.db.execute(`DELETE FROM button WHERE id = $1 AND category_id = $2`, [
			buttonId,
			categoryId
		]);
	}

	async deleteTagFromCategory(categoryId: string, tagId: string): Promise<void> {
		await this.db.execute(`DELETE FROM tag WHERE id = $1 AND category_id = $2`, [
			tagId,
			categoryId
		]);
	}
}
