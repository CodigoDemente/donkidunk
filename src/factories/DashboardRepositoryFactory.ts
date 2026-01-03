import type Database from '@tauri-apps/plugin-sql';
import type { DashboardRepository } from '../ports/DashboardRepository';
import { SQLiteDashboardRepository } from '../adaptors/SQLiteDashboardRepository';

export class DashboardRepositoryFactory {
	private static singleton: DashboardRepository;

	static create(db: Database): DashboardRepository {
		if (!this.singleton) {
			this.singleton = new SQLiteDashboardRepository(db);
		}

		return this.singleton;
	}

	static getInstance(): DashboardRepository {
		if (!this.singleton) {
			throw new Error('DashboardRepository has not been created. Call create() first.');
		}

		return this.singleton;
	}

	static reset(): void {
		this.singleton = undefined as unknown as DashboardRepository; // Reset the singleton instance
	}
}
