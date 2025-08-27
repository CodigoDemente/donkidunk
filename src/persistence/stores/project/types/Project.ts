import type Database from '@tauri-apps/plugin-sql';

export type ProjectData = {
	metadata: {
		timestamp: string;
		backupId: string | null;
		dirty: boolean;
	};
	file: {
		currentPath: string;
		originalPath: string;
	};
	video: {
		path?: string;
	};
	modal: {
		content: unknown;
		title?: string;
		onCancel?: () => void;
		onSubmit?: () => void;
		show: boolean;
	};
	database: Database | null;
};
