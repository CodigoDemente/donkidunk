import Database from '@tauri-apps/plugin-sql';
import { debug } from '@tauri-apps/plugin-log';
import ProjectStore from '../stores/project.svelte';
import { migrations } from './migrations';
import { appConfigDir, join } from '@tauri-apps/api/path';

export async function checkForMigrations(database: Database): Promise<void> {
	const result = await database.select<string[]>(
		"SELECT tbl_name FROM sqlite_schema WHERE type = 'table' AND name = 'migrations'"
	);

	if (result.length === 0) {
		await database.execute(`
              CREATE TABLE migrations (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
        `);
		debug('Migrations table created successfully');
	}

	const lastMigration = await database.select<{ id: number }[]>(
		'SELECT id FROM migrations ORDER BY applied_at DESC LIMIT 1'
	);

	let firstMigrationIndex = 0;

	if (lastMigration.length) {
		const lastMigrationId = lastMigration[0].id;
		// +1 because we want to start from the next migration
		firstMigrationIndex =
			Math.max(
				migrations.findIndex((migration) => migration.id === lastMigrationId),
				0
			) + 1;
	}

	for (let i = firstMigrationIndex; i < migrations.length; i++) {
		const migration = migrations[i];

		await database.execute(
			`
            BEGIN TRANSACTION;
            
            ${migration.sql}

            INSERT INTO migrations (id, name) VALUES (?, ?);

            COMMIT;
        `,
			[migration.id, migration.name]
		);

		debug(`Migration ${migration.name} applied successfully`);
	}

	debug('All migrations applied successfully');
}

export async function openDatabase(
	dbPath: string,
	relative: boolean,
	checkMigrations = true
): Promise<Database> {
	debug(`Opening database at path: ${dbPath}`);

	const db = await Database.load(`sqlite:${dbPath}`);

	const result = await db.execute('SELECT 1');

	debug(`Database connection test result: ${result}`);

	if (relative) {
		const configPath = await appConfigDir();

		const absPath = await join(configPath, db.path.replace('sqlite:', ''));
		ProjectStore.file.path = absPath;
	} else {
		ProjectStore.file.path = dbPath;
	}

	ProjectStore.database = db;

	if (checkMigrations) {
		await checkForMigrations(db);
		debug('Migrations checked successfully');
	}

	return db;
}

export async function closeDatabase(): Promise<void> {
	debug('Closing database');

	const db = ProjectStore.database;

	await db?.close();

	ProjectStore.database = null;
	ProjectStore.file.path = '';
	ProjectStore.file.newlyCreated = false;

	debug('Database closed successfully');
}
