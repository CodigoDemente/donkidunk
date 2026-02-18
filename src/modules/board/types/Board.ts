import type { CategoryType } from './CategoryType';
import type { Category } from './Category';

export type BoardData = {
	[CategoryType.Event]: Category[];
	[CategoryType.Tag]: Category[];
};
