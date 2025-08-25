import Database from '@tauri-apps/plugin-sql';
import { debug } from '@tauri-apps/plugin-log';
import { v4 as uuidv4 } from 'uuid';
import ProjectStore from '../stores/project/store.svelte';
import { migrations } from './migrations';
import { appLocalDataDir, BaseDirectory, join } from '@tauri-apps/api/path';
import { exists, truncate } from '@tauri-apps/plugin-fs';
import type { ProjectRepository } from '../../ports/ProjectRepository';
import { ProjectRepositoryFactory } from '../../factories/ProjectRepositoryFactory';
import { projectActions } from '../stores/project/actions';
import { emit } from '@tauri-apps/api/event';
import { BoardRepositoryFactory } from '../../factories/BoardRepositoryFactory';
import type { BoardRepository } from '../../ports/BoardRepository';
import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
import type { TimelineRepository } from '../../ports/TimelineRepository';
import { Board } from '../../modules/board/context.svelte';
import type { Timeline } from '../../modules/videoplayer/context.svelte';

const DB_BACKUP_EXTENSION = 'dnk';

export async function checkForMigrations(database: Database): Promise<void> {
	const result = await database.select<string[]>(
		"SELECT tbl_name FROM sqlite_schema WHERE type = 'table' AND name = 'migrations'"
	);

	if (result.length === 0) {
		await database.execute(`
              CREATE TABLE migrations (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TIMESTAMP DATETIME DEFAULT(datetime('subsec'))
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

export async function createBackupDatabase(backupId: string): Promise<Database> {
	debug(`Creating backup database without base database with ID: ${backupId}`);

	const dataDir = await appLocalDataDir();
	const backupName = `${backupId}.${DB_BACKUP_EXTENSION}`;
	const backupPath = await join(dataDir, backupName);

	return openDatabase(backupPath, true, backupId);
}

export async function openDatabase(
	dbPath: string,
	checkMigrations = true,
	preexistingBackupId = ''
): Promise<Database> {
	debug(`Opening database at path: ${dbPath}`);

	const db = await Database.load(`sqlite:${dbPath}`);

	const result = await db.execute('SELECT 1');

	debug(`Database connection test result: ${result}`);

	if (checkMigrations) {
		await checkForMigrations(db);
		debug('Migrations checked successfully');
	}

	ProjectRepositoryFactory.reset();
	const repository = ProjectRepositoryFactory.create(db);

	BoardRepositoryFactory.reset();
	BoardRepositoryFactory.create(db);

	TimelineRepositoryFactory.reset();
	TimelineRepositoryFactory.create(db);

	projectActions.setCurrentFilePath(dbPath);
	projectActions.setDatabase(db);

	let backupId = await repository.getBackupId();

	if (!backupId) {
		debug('No backup ID found, generating a new one');

		backupId = preexistingBackupId || uuidv4();

		await projectActions.setBackupId(backupId);
	}

	return db;
}

export async function closeDatabase(): Promise<void> {
	debug('Closing database');

	const db = projectActions.getDatabase();

	await db?.close();

	projectActions.setFilePath('');
	projectActions.setCurrentFilePath('');
	projectActions.setDatabase(null);

	debug('Database closed successfully');
}

export async function loadProjectFromDatabase(repository: ProjectRepository): Promise<void> {
	debug('Loading project from database');

	// Here we don't use the repository nor the actions for setting the values because we know that in the
	// database the values are already set, so we can directly assign them to the store.

	const projectStore = ProjectStore.getState();

	const videoPath = await repository.getVideoPath();
	if (videoPath) {
		projectStore.video.path = videoPath;
	}

	const savedTimestamp = await repository.getLastSavedTimestamp();
	if (savedTimestamp) {
		projectStore.metadata.timestamp = savedTimestamp;
	}
}

export async function loadBoardFromDatabase(
	repository: BoardRepository,
	board: Board
): Promise<void> {
	board.getState().eventCategories = await repository.getSectionCategories('event');
	board.getState().actionCategories = await repository.getSectionCategories('action');
	board.getState().tagsRelatedToEvents = await repository.getTagsRelatedToEvents();
}

export async function loadTimelineFromDatabase(
	repository: TimelineRepository,
	timeline: Timeline
): Promise<void> {
	timeline.getState().eventTimeline = await repository.getEvents();
	timeline.getState().actionTimeline = await repository.getActions();
}

export async function backupDatabase(backupId: string): Promise<string> {
	debug(`Backing up database`);

	const backupExists = await checkBackupExistence(backupId);

	const backupName = `${backupId}.${DB_BACKUP_EXTENSION}`;

	if (backupExists) {
		debug(`Backup file already exists. Overwriting...`);
		await truncate(backupName, 0, {
			baseDir: BaseDirectory.AppLocalData
		});
	}

	const db = projectActions.getDatabase();

	if (!db) {
		debug('No database connection found');
		return '';
	}

	const dataDir = await appLocalDataDir();

	const path = await join(dataDir, backupName);

	await db.execute('VACUUM main INTO ?', [path]);

	return path;
}

export async function emptyBackup(backupId: string): Promise<void> {
	debug(`Emptying backup database: ${backupId}`);

	const backupName = `${backupId}.${DB_BACKUP_EXTENSION}`;

	await truncate(backupName, 0, {
		baseDir: BaseDirectory.AppLocalData
	});
}

export async function restoreBackup(backupId: string): Promise<void> {
	debug(`Restoring database from backup: ${backupId}`);

	const originalFilePath = projectActions.getFilePath();

	await closeDatabase();

	const dataDir = await appLocalDataDir();
	const backupPath = await join(dataDir, `${backupId}.${DB_BACKUP_EXTENSION}`);

	await openDatabase(backupPath, true);

	await projectActions.setLastSavedTimestamp(new Date().toISOString());

	projectActions.setFilePath(originalFilePath);

	debug('Database restored from backup successfully');
}

export async function checkBackupExistence(backupId: string | null): Promise<boolean> {
	debug('Checking if backup exists');

	if (!backupId) {
		debug('No backup ID provided');
		return false;
	}

	const backupExists = await exists(`${backupId}.${DB_BACKUP_EXTENSION}`, {
		baseDir: BaseDirectory.AppLocalData
	});

	debug(`Backup exists: ${backupExists}`);

	return backupExists;
}

export async function dumpIntoOriginalDatabase(originalPath: string): Promise<void> {
	debug(`Dumping database into original path: ${originalPath}`);

	const db = projectActions.getDatabase();

	if (!db) {
		debug('No database connection found');
		return;
	}

	const originalExists = await exists(originalPath);

	if (originalExists) {
		await truncate(originalPath, 0);
	}

	await db.execute('VACUUM main INTO ?', [originalPath]);

	await emit('project:saved');

	debug('Database dumped into original path successfully');
}
