import type { CategoryType } from '../board/types/CategoryType';

export type ExportingRule = {
	type: CategoryType;
	include: string;
	taggedWith: string[];
	temp: boolean;
};

export type ExportClipTag = {
	id: string;
	name: string;
	color: string;
};

export type ExportClip = {
	id: string;
	title: string;
	categoryName: string;
	startTime: number;
	endTime: number;
	tags: ExportClipTag[];
};
