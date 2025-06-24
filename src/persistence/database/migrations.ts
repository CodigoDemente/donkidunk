type Migration = {
	id: number;
	name: string;
	sql: string;
};

// Mandatory this is ordered and idempotent
export const migrations: Migration[] = [
	{
		id: 1,
		name: 'CreateConfigurationTable',
		sql: `
        CREATE TABLE IF NOT EXISTS configuration (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL
        );`
	},
	{
		id: 2,
		name: 'CreateCategoryTable',
		sql: `
		CREATE TABLE IF NOT EXISTS category (
			id INTEGER PRIMARY KEY,
			type TEXT CHECK( type in ('event', 'action') ) NOT NULL,
			color TEXT NOT NULL,
			grid_position_x INTEGER NOT NULL,
			grid_position_y INTEGER NOT NULL
		);`
	},
	{
		id: 3,
		name: 'CreateButtonTable',
		sql: `
		CREATE TABLE IF NOT EXISTS button (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			category_id INTEGER NOT NULL,
			FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
		);`
	},
	{
		id: 4,
		name: 'CreateTagTable',
		sql: `
		CREATE TABLE IF NOT EXISTS tag (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			color TEXT NOT NULL
		);`
	},
	{
		id: 5,
		name: 'CreateTimelineEntryTable',
		sql: `
		CREATE TABLE IF NOT EXISTS timeline_entry (
			id INTEGER PRIMARY KEY,
			button_id INTEGER NOT NULL,
			category_id INTEGER NOT NULL,
			type TEXT CHECK( type in ('event', 'action') ) NOT NULL,
			timestamp_start REAL NOT NULL,
			timestamp_end REAL NOT NULL,
			FOREIGN KEY (button_id) REFERENCES button(id) ON DELETE CASCADE,
			FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
		);`
	},
	{
		id: 6,
		name: 'CreateTimelineEntryTagTable',
		sql: `
		CREATE TABLE IF NOT EXISTS timeline_entry_tag (
			timeline_entry_id INTEGER NOT NULL,
			tag_id INTEGER NOT NULL,
			FOREIGN KEY (timeline_entry_id) REFERENCES timeline_entry(id) ON DELETE CASCADE,
			FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE,
			PRIMARY KEY (timeline_entry_id, tag_id)
		);`
	}
];
