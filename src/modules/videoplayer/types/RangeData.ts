export interface RangeData {
	id: string;
	buttonId: string;
	categoryId: string;
	timestamp: {
		start: number;
		end: number | undefined;
	};
}

export interface RangeDataWithTags extends RangeData {
	tagsRelated: string[];
}
