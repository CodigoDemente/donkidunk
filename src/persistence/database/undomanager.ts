import type Database from '@tauri-apps/plugin-sql';

/**
 * Undo/Redo system for database changes
 * Translated from the original TCL code
 */
export class UndoManager {
	// Private state of the undo/redo system
	private isActive: boolean = false;
	private undoStack: Array<[number, number]> = [];
	private redoStack: Array<[number, number]> = [];
	private pendingTimeout: number | null = null;
	private firstLog: number = 1;
	private freezePoint: number = -1;

	// Reference to the database
	private db: Database;

	/**
	 * Constructor that initializes the state
	 * @param db Database object that must implement 'execute' and 'select' methods
	 */
	constructor(db: Database) {
		this.db = db;
	}

	/**
	 * Activates the undo/redo system
	 * @param tables Database tables to track
	 */
	public activate(...tables: string[]): void {
		if (this.isActive) return;

		this.createTriggers(this.db, ...tables);
		this.undoStack = [];
		this.redoStack = [];
		this.isActive = true;
		this.freezePoint = -1;
		this.startInterval();
	}

	/**
	 * Deactivates the undo/redo system and clears the stacks
	 */
	public deactivate(): void {
		if (!this.isActive) return;

		this.dropTriggers(this.db);
		this.undoStack = [];
		this.redoStack = [];
		this.isActive = false;
		this.freezePoint = -1;
	}

	/**
	 * Stops accepting database changes for the undo stack
	 */
	public async freeze(): Promise<void> {
		if (this.freezePoint >= 0) {
			throw new Error('Recursive call to freeze');
		}

		const result = await this.db.select<{ coalesce: number }[]>(
			'SELECT coalesce(max(seq),0) FROM undolog'
		);
		this.freezePoint = result[0].coalesce;
	}

	/**
	 * Resumes accepting actions for undo
	 */
	public async unfreeze(): Promise<void> {
		if (this.freezePoint < 0) {
			throw new Error('Called unfreeze while not frozen');
		}

		await this.db.execute(`DELETE FROM undolog WHERE seq>${this.freezePoint}`);
		this.freezePoint = -1;
	}

	/**
	 * Registers that an undoable action has occurred
	 */
	public event(): void {
		if (this.pendingTimeout === null) {
			this.pendingTimeout = window.setTimeout(() => this.barrier(), 0);
		}
	}

	/**
	 * Creates an undo barrier right now
	 */
	public async barrier(): Promise<void> {
		if (this.pendingTimeout !== null) {
			window.clearTimeout(this.pendingTimeout);
			this.pendingTimeout = null;
		}

		if (!this.isActive) {
			return;
		}

		const result = await this.db.select<{ coalesce: number }[]>(
			'SELECT coalesce(max(seq),0) FROM undolog'
		);
		const end = result[0].coalesce;
		const finalEnd = this.freezePoint >= 0 && end > this.freezePoint ? this.freezePoint : end;

		const begin = this.firstLog;
		this.startInterval();

		if (begin === this.firstLog) {
			return;
		}

		this.undoStack.push([begin, finalEnd]);
		this.redoStack = [];
	}

	/**
	 * Performs a single undo step
	 */
	public undo(): void {
		this.step('undoStack', 'redoStack');
	}

	/**
	 * Performs a single redo step
	 */
	public redo(): void {
		this.step('redoStack', 'undoStack');
	}

	/**
	 * Creates triggers to record changes in the specified tables
	 */
	private async createTriggers(db: Database, ...tables: string[]): Promise<void> {
		try {
			await db.execute('DROP TABLE undolog');
		} catch {
			// Table didn't exist, ignore error
		}

		await db.execute('CREATE TEMP TABLE undolog(seq integer primary key, sql text)');

		for (const tbl of tables) {
			const columnsResult = await db.select<{ name: string }[]>(`pragma table_info(${tbl})`);
			let sql = `CREATE TEMP TRIGGER _${tbl}_it AFTER INSERT ON ${tbl} BEGIN\n`;
			sql += `  INSERT INTO undolog VALUES(NULL, 'DELETE FROM ${tbl} WHERE rowid='||new.rowid);\nEND;\n`;

			sql += `CREATE TEMP TRIGGER _${tbl}_ut AFTER UPDATE ON ${tbl} BEGIN\n`;
			sql += `  INSERT INTO undolog VALUES(NULL, 'UPDATE ${tbl} `;
			let sep = 'SET ';

			for (const col of columnsResult) {
				sql += `${sep}${col.name}='||quote(old.${col.name})||'`;
				sep = ',';
			}

			sql += ` WHERE rowid='||old.rowid);\nEND;\n`;

			sql += `CREATE TEMP TRIGGER _${tbl}_dt BEFORE DELETE ON ${tbl} BEGIN\n`;
			sql += `  INSERT INTO undolog VALUES(NULL, 'INSERT INTO ${tbl}(rowid`;

			for (const col of columnsResult) {
				sql += `,${col.name}`;
			}

			sql += `) VALUES('||old.rowid||'`;

			for (const col of columnsResult) {
				sql += `,'||quote(old.${col.name})||'`;
			}

			sql += `)');\nEND;\n`;

			await db.execute(sql);
		}
	}

	/**
	 * Removes all triggers created by createTriggers
	 */
	private async dropTriggers(db: Database): Promise<void> {
		const triggersResult = await db.select<{ name: string }[]>(
			"SELECT name FROM sqlite_temp_schema WHERE type='trigger'"
		);

		for (const trigger of triggersResult) {
			// Using JS RegExp to verify the pattern
			if (!/^_.*_(i|u|d)t$/.test(trigger.name)) continue;
			await db.execute(`DROP TRIGGER ${trigger.name};`);
		}

		try {
			await db.execute('DROP TABLE undolog');
		} catch {
			// Ignore error if table doesn't exist
		}
	}

	/**
	 * Records the initial conditions of an undo interval
	 */
	private async startInterval(): Promise<void> {
		const result = await this.db.select<{ coalesce: number }[]>(
			'SELECT coalesce(max(seq),0)+1 FROM undolog'
		);
		this.firstLog = result[0].coalesce;
	}

	/**
	 * Performs an undo or redo step
	 */
	private async step(
		sourceStack: 'undoStack' | 'redoStack',
		targetStack: 'undoStack' | 'redoStack'
	): Promise<void> {
		const stack = this[sourceStack];
		if (!stack.length) return;

		const op = stack[stack.length - 1];
		this[sourceStack] = stack.slice(0, -1);

		const [begin, end] = op;

		await this.db.execute('BEGIN');

		const q1 = `SELECT sql FROM undolog WHERE seq>=${begin} AND seq<=${end} ORDER BY seq DESC`;
		const sqlListResult = await this.db.select<{ sql: string }[]>(q1);
		const sqlList = sqlListResult.map((row) => row.sql);

		await this.db.execute(`DELETE FROM undolog WHERE seq>=${begin} AND seq<=${end}`);

		const firstLogResult = await this.db.select<{ coalesce: number }[]>(
			'SELECT coalesce(max(seq),0)+1 FROM undolog'
		);
		this.firstLog = firstLogResult[0].coalesce;

		for (const sql of sqlList) {
			await this.db.execute(sql);
		}

		await this.db.execute('COMMIT');

		const newEndResult = await this.db.select<{ coalesce: number }[]>(
			'SELECT coalesce(max(seq),0) FROM undolog'
		);
		const newEnd = newEndResult[0].coalesce;
		const newBegin = this.firstLog;

		this[targetStack].push([newBegin, newEnd]);
		this.startInterval();
	}
}
