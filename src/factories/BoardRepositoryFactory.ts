import type Database from '@tauri-apps/plugin-sql';
import type { BoardRepository } from '../ports/BoardRepository';
import { SQLiteBoardRepository } from '../adaptors/SQLiteBoardRepository';

export class BoardRepositoryFactory {
	private static singleton: BoardRepository;

	static create(db: Database): BoardRepository {
		if (!this.singleton) {
			this.singleton = new SQLiteBoardRepository(db);
		}

		return this.singleton;
	}

	static getInstance(): BoardRepository {
		if (!this.singleton) {
			throw new Error('BoardRepository has not been created. Call create() first.');
		}

		return this.singleton;
	}

	static reset(): void {
		this.singleton = undefined as unknown as BoardRepository; // Reset the singleton instance
	}
}
