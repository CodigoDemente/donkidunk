import type Database from '@tauri-apps/plugin-sql';
import type { Component } from 'svelte';
import type { ButtonBoard } from '../../../../modules/config/types/ButtonBoard';

export type ModalSize = 'medium' | 'small' | 'large' | 'extralarge';

export type NewProjectFormData = {
	projectPath: string;
	videoPath: string;
	buttonBoard: ButtonBoard;
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
		onSubmitText?: string;
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
