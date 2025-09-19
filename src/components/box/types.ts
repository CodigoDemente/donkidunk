import type { Category } from '../../modules/board/types/Category';

export type Props = {
	boxHeight: number;
	isOpened: boolean;
	otherIsOpened: boolean;
	title: string;
	type: 'eventCategories' | 'actionCategories';
	categories: Category[];
};
