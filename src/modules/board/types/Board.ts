import type { CategoryType } from '../../../components/box/types';
import type { Category } from './Category';

export type BoardData = {
	[CategoryType.Event]: Category[];
	[CategoryType.Tag]: Category[];
};
