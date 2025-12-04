import type { Category } from '../../modules/board/types/Category';
import type { Tag } from '../../modules/board/types/Tag';

export enum CategoryType {
	Event = 'event',
	Tag = 'tag'
}

export type DraggedCategory = {
	id: number;
	offset: {
		x: number;
		y: number;
	};
	container: {
		width: number;
		height: number;
	};
};

export type Props = {
	boxHeight: number;
	isOpened: boolean;
	otherIsOpened: boolean;
	title: string;
	type: CategoryType;
	categories: Category[];
	tags?: Tag[];
};
