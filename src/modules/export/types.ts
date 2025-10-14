import type { CategoryType } from '../../components/box/types';

export type ExportingRule = {
	type: CategoryType;
	include: number;
	taggedWith: number[];
	temp: boolean;
};
