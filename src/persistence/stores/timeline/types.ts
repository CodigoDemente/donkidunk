export interface TagsData {
	categoryId: string;
	tags: {
		tagId: string;
		timestamp: number[];
	}[];
}

export interface EventsData {
	eventCategoryId: string;
	events: {
		eventId: string;
		timestamp: number[];
	}[];
}
