import type Database from '@tauri-apps/plugin-sql';

export type ProjectData = {
	file: {
		newlyCreated: boolean;
		path: string;
	};
	video: {
		path: string;
	};
	database: Database | null;
};
