import type Database from '@tauri-apps/plugin-sql';

export type ModalSize = 'medium' | 'small' | 'large' | 'extralarge';
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
		contentProps?: Record<string, unknown>;
		title?: string;
		onCancel?: () => void;
		onSubmit?: () => void;
		show: boolean;
		size?: ModalSize;
	};
	database: Database | null;
};
