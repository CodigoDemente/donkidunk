import type { CategoryType } from '../components/box/types';
import type { Button } from '../modules/board/types/Button';
import type { Category } from '../modules/board/types/Category';
import type { Tag } from '../modules/board/types/Tag';

export interface BoardRepository {
	getSectionCategories(section: CategoryType): Promise<Category[]>;
	getTagsRelatedToEvents(): Promise<Tag[]>;
	addCategory(section: CategoryType, name: string, color: string): Promise<number>;
	deleteCategory(categoryId: number): Promise<void>;
	addTagsList(list: Tag[]): Promise<Tag[]>;
	addButtonToCategory(categoryId: number, button: Button): Promise<number>;
	updateCategoryPosition(categoryId: number, x: number, y: number): Promise<void>;
	updateCategoryName(categoryId: number, categoryName: string): Promise<void>;
	updateCategory(categoryId: number, categoryName: string, color: string): Promise<void>;
	updateCategoryButtons(categoryId: number, buttons: Button[]): Promise<number[]>;
}
