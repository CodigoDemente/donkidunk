import type Database from '@tauri-apps/plugin-sql';
import type { Component } from 'svelte';

export type ModalSize = 'medium' | 'small' | 'large' | 'extralarge';

export type NewProjectFormData = {
	projectPath: string;
	videoPath: string;
};

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
	snackbar: {
		title?: string;
		message?: string;
		type: 'info' | 'error' | 'success' | 'warning';
		show: boolean;
		mode: 'auto' | 'manual';
	};
	database: Database | null;
	newProjectFormData: NewProjectFormData | null;
};
