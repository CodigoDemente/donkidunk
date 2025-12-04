import type { CategoryType } from '../../../components/box/types';
import type { Tag } from './Tag';
import type { Button } from './Button';

export interface Category {
	id: number;
	name: string;
	type: CategoryType;
	color: string;
	position: { x: number; y: number };
	buttons: Button[] | Tag[];
}
