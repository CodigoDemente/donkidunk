import type Database from '@tauri-apps/plugin-sql';
import type { Component } from 'svelte';

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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		content: Component<any> | null;
		props?: Record<string, unknown>;
		title?: string;
		onCancel?: () => void | Promise<void>;
		onSubmit?: () => void | Promise<void>;
		show: boolean;
		size?: ModalSize;
	};
	database: Database | null;
};
