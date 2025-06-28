import type { Category } from '../persistence/stores/board/types/Category';
import type { Tag } from '../persistence/stores/board/types/Tag';

export interface BoardRepository {
	getSectionCategories(section: 'event' | 'action'): Promise<Category[]>;
	getTagsRelatedToEvents(): Promise<Tag[]>;
	addCategory(section: 'event' | 'action', name: string, color: string): Promise<number>;
	addButtonToCategory(categoryId: number, name: string): Promise<number>;
	updateCategoryPosition(categoryId: number, x: number, y: number): Promise<void>;
	updateCategoryName(categoryId: number, categoryName: string): Promise<void>;
}
