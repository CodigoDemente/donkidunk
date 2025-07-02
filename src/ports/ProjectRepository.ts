export interface ProjectRepository {
	addGenericConfiguration(name: string, value: string): Promise<void>;
	getGenericConfiguration(name: string): Promise<string | null>;
	removeGenericConfiguration(name: string): Promise<void>;
	setVideoPath(path: string): Promise<void>;
	getVideoPath(): Promise<string | null>;
	removeVideoPath(): Promise<void>;
	setLastSavedTimestamp(timestamp: string): Promise<void>;
	getLastSavedTimestamp(): Promise<string | null>;
	removeLastSavedTimestamp(): Promise<void>;
	setBackupId(backupId: string): Promise<void>;
	getBackupId(): Promise<string | null>;
}
