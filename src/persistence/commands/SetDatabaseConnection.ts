import { invoke } from '@tauri-apps/api/core';

export async function setDatabaseConnection(databasePath: string): Promise<void> {
	return await invoke<void>('set_database_conn', {
		databasePath
	});
}

export async function disconnectDatabase(): Promise<void> {
	return await invoke<void>('disconnect_database');
}
