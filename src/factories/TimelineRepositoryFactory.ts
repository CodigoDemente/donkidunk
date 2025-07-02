import type Database from '@tauri-apps/plugin-sql';
import type { TimelineRepository } from '../ports/TimelineRepository';
import { SQLiteTimelineRepository } from '../adaptors/SQLiteTimelineRepository';

export class TimelineRepositoryFactory {
	private static singleton: TimelineRepository;

	static create(db: Database): TimelineRepository {
		if (!this.singleton) {
			this.singleton = new SQLiteTimelineRepository(db);
		}

		return this.singleton;
	}

	static getInstance(): TimelineRepository {
		if (!this.singleton) {
			throw new Error('TimelineRepository has not been created. Call create() first.');
		}

		return this.singleton;
	}

	static reset(): void {
		this.singleton = undefined as unknown as TimelineRepository; // Reset the singleton instance
	}
}
