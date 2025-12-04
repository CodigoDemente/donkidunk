export type DatabaseEntry = {
	id: number;
	button_id: number;
	category_id: number;
	timestamp_start: number;
	timestamp_end?: number;
};

export type DatabaseEntryWithTag = DatabaseEntry & {
	timeline_entry_id: number;
	tag_id: number;
};
