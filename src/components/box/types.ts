import type { Category } from '../../persistence/stores/board/types/Category';

export interface Props {
	boxHeight: number;
	isOpened: boolean;
	otherIsOpened: boolean;
	title: string;
	type: 'eventCategories' | 'actionCategories';
	categories: Category[];
}
