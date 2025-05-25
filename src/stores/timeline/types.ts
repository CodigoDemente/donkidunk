export interface RangeData {
	id: string;
	buttonId: string;
	categoryId: string;
	timestamp: {
		start: number;
		end: number;
	};
}

export interface RangeDataWithTags extends RangeData {
	tagsRelated: string[];
}
