export interface RangeData {
	id: number;
	buttonId: number;
	categoryId: number;
	timestamp: {
		start: number;
		end: number | undefined;
	};
}

export interface RangeDataWithTags extends RangeData {
	tagsRelated: number[];
}
