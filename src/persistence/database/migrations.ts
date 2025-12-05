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
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL
        );`
	},
	{
		id: 2,
		name: 'CreateCategoryTable',
		sql: `
		CREATE TABLE IF NOT EXISTS category (
			id TEXT PRIMARY KEY,
			type TEXT CHECK( type in ('event', 'tag') ) NOT NULL,
			name TEXT NOT NULL,
			color TEXT NOT NULL,
			grid_position_x INTEGER NOT NULL,
			grid_position_y INTEGER NOT NULL
		);`
	},
	{
		id: 3,
		name: 'CreateButtonTable',
		sql: `CREATE TABLE IF NOT EXISTS button (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			range TEXT,
			duration INTEGER,
			color TEXT NOT NULL,
			before INTEGER,
			category_id TEXT NOT NULL,
			FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
		);`
	},
	{
		id: 4,
		name: 'CreateTagTable',
		sql: `
		CREATE TABLE IF NOT EXISTS tag (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			color TEXT NOT NULL,
			category_id TEXT NOT NULL,
			FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
		);`
	},
	{
		id: 5,
		name: 'CreateTimelineEntryTable',
		sql: `
		CREATE TABLE IF NOT EXISTS timeline_entry (
			id TEXT PRIMARY KEY,
			button_id TEXT NOT NULL,
			category_id TEXT NOT NULL,
			timestamp_start REAL NOT NULL,
			timestamp_end REAL,
			FOREIGN KEY (button_id) REFERENCES button(id) ON DELETE CASCADE,
			FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
		);`
	},
	{
		id: 6,
		name: 'CreateTimelineEntryTagTable',
		sql: `
		CREATE TABLE IF NOT EXISTS timeline_entry_tag (
			timeline_entry_id TEXT NOT NULL,
			tag_id TEXT NOT NULL,
			FOREIGN KEY (timeline_entry_id) REFERENCES timeline_entry(id) ON DELETE CASCADE,
			FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE,
			PRIMARY KEY (timeline_entry_id, tag_id)
		);`
	}
];
