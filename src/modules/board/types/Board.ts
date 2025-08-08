import type { Category } from './Category';
import type { Tag } from './Tag';

export type BoardData = {
	eventCategories: Category[];
	actionCategories: Category[];
	tagsRelatedToEvents: Tag[];
};
