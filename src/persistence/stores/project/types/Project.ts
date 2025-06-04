import type Database from '@tauri-apps/plugin-sql';

export type ProjectData = {
	metadata: {
		timestamp: string;
	};
	file: {
		newlyCreated: boolean;
		path: string;
	};
	video: {
		path: string;
	};
	database: Database | null;
};
