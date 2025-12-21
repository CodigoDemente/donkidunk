import type { CategoryType } from '../../components/box/types';

export type ExportingRule = {
	type: CategoryType;
	include: string;
	taggedWith: string[];
	temp: boolean;
};
