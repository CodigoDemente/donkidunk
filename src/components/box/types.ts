import type { Category } from '../../modules/board/types/Category';
import type { Tag } from '../../modules/board/types/Tag';

export enum CategoryType {
	Event = 'event',
	Action = 'action'
}

export type Props = {
	boxHeight: number;
	isOpened: boolean;
	otherIsOpened: boolean;
	title: string;
	type: CategoryType;
	categories: Category[];
	tags?: Tag[];
};
