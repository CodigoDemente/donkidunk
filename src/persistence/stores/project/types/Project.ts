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
		content: Component | null;
		props?: Record<string, unknown>;
		title?: string;
		onCancel?: () => void;
		onSubmit?: () => void;
		show: boolean;
		size?: ModalSize;
	};
	database: Database | null;
};
