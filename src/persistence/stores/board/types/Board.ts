import type { Category } from './Category';
import type { Tag } from './Tag';

export type BoardData = {
	isEditing: boolean;
	eventCategories: Category[];
	actionCategories: Category[];
	tagsRelatedToEvents: Tag[];
	category: Category;
};
