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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL
        );`
	}
];
