import type { Category } from '../persistence/stores/board/types/Category';
import type { Tag } from '../persistence/stores/board/types/Tag';

export interface BoardRepository {
	getSectionCategories(section: 'event' | 'action'): Promise<Category[]>;
	getTagsRelatedToEvents(): Promise<Tag[]>;
	addCategory(section: 'event' | 'action', name: string, color: string): Promise<void>;
	addButtonToCategory(categoryId: string, name: string): Promise<void>;
	updateCategoryPosition(categoryId: string, x: number, y: number): Promise<void>;
	updateCategoryName(categoryId: string, categoryName: string): Promise<void>;
}
