import type { CategoryType } from '../components/box/types';
import type { Button } from '../modules/board/types/Button';
import type { Category } from '../modules/board/types/Category';
import type { Tag } from '../modules/board/types/Tag';

export interface BoardRepository {
	getSectionCategories(section: CategoryType): Promise<Category[]>;
	categoryExists(categoryId: string): Promise<boolean>;
	getTagsRelatedToEvents(): Promise<Tag[]>;
	addCategory(category: Category): Promise<void>;
	deleteCategory(categoryId: string): Promise<void>;
	addTagToCategory(categoryId: string, tag: Tag): Promise<void>;
	addButtonToCategory(categoryId: string, button: Button): Promise<void>;
	updateCategory(category: Category): Promise<void>;
	updateCategoryButtons(categoryId: string, buttons: Button[]): Promise<void>;
	updateCategoryTags(categoryId: string, tags: Tag[]): Promise<void>;
	deleteButtonFromCategory(categoryId: string, buttonId: string): Promise<void>;
	deleteTagFromCategory(categoryId: string, tagId: string): Promise<void>;
}
