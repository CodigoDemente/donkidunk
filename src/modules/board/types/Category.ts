import type { CategoryType } from '../../../components/box/types';
import type { Tag } from './Tag';
import type { Button } from './Button';

export interface Category {
	id: string;
	name: string;
	type: CategoryType;
	color: string;
	position: { x: number; y: number };
	size?: { width: number; height: number };
	buttons: Button[] | Tag[];
}
