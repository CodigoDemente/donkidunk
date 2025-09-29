import type { Category } from '../../modules/board/types/Category';
import type { Tag } from '../../modules/board/types/Tag';

export type Props = {
	boxHeight: number;
	isOpened: boolean;
	otherIsOpened: boolean;
	title: string;
	type: 'eventCategories' | 'actionCategories';
	categories: Category[];
	tags?: Tag[];
};
