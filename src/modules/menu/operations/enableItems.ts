import { invoke } from '@tauri-apps/api/core';

export async function enableImportVideo() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'import_video',
		enabled: true
	});
}

export async function disableImportVideo() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'import_video',
		enabled: false
	});
}

export async function enableCloseProject() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'close_project',
		enabled: true
	});
}

export async function disableCloseProject() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'close_project',
		enabled: false
	});
}

export async function enableSaveProject() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'save_project',
		enabled: true
	});
}

export async function disableSaveProject() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'save_project',
		enabled: false
	});
}

export async function setUndoEnablingStatus(enabled: boolean) {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'undo',
		enabled
	});
}

export async function setRedoEnablingStatus(enabled: boolean) {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'redo',
		enabled
	});
}

export async function enableSaveButtonBoard() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'save_button_board',
		enabled: true
	});
}

export async function disableSaveButtonBoard() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'save_button_board',
		enabled: false
	});
}
