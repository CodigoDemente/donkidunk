export type DatabaseEntry = {
	id: string;
	button_id: string;
	category_id: string;
	timestamp_start: number;
	timestamp_end?: number;
};

export type DatabaseEntryWithTag = DatabaseEntry & {
	timeline_entry_id: string;
	tag_id: string;
};
