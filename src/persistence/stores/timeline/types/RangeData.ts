export interface RangeData {
	id: number;
	buttonId: number;
	categoryId: number;
	timestamp: {
		start: number;
		end: number | null;
	};
}

export interface RangeDataWithTags extends RangeData {
	tagsRelated: number[];
}
