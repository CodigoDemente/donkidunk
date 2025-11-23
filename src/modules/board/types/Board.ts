import type { CategoryType } from '../../../components/box/types';
import type { Category } from './Category';
import type { Tag } from './Tag';

export type BoardData = {
	[CategoryType.Event]: Category[];
	tagsRelatedToEvents: Tag[];
};
