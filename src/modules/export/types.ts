import type { CategoryType } from '../board/types/CategoryType';

export type ExportingRule = {
	type: CategoryType;
	include: string;
	taggedWith: string[];
	temp: boolean;
};
