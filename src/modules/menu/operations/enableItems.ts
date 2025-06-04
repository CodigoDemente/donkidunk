import { invoke } from '@tauri-apps/api/core';

export async function enableImportVideo() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'import_video',
		enabled: true
	});
}

export async function enableSaveProject() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'save_project',
		enabled: true
	});
}
