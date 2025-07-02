import type Database from '@tauri-apps/plugin-sql';
import type { ProjectRepository } from '../ports/ProjectRepository';
import { SQLiteProjectRepository } from '../adaptors/SQLiteProjectRepository';

export class ProjectRepositoryFactory {
	private static singleton: ProjectRepository;

	static create(db: Database): ProjectRepository {
		if (!this.singleton) {
			this.singleton = new SQLiteProjectRepository(db);
		}

		return this.singleton;
	}

	static getInstance(): ProjectRepository {
		if (!this.singleton) {
			throw new Error('ProjectRepository has not been created. Call create() first.');
		}

		return this.singleton;
	}

	static reset(): void {
		this.singleton = undefined as unknown as ProjectRepository; // Reset the singleton instance
	}
}
