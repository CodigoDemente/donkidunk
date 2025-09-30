import type { CategoryType } from '../../components/box/types';

export type DatabaseEntry = {
	id: number;
	button_id: number;
	category_id: number;
	type: CategoryType;
	timestamp_start: number;
	timestamp_end?: number;
};

export type DatabaseEntryWithTag = DatabaseEntry & {
	timeline_entry_id: number;
	tag_id: number;
};
