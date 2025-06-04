import { invoke } from '@tauri-apps/api/core';
import { saveProjectToDatabase } from '../../../persistence/database/index.svelte';
import ProjectStore from '../../../persistence/stores/project/store.svelte';

export async function saveProject() {
	const timeStamp = new Date().toISOString();

	ProjectStore.metadata.timestamp = timeStamp;

	await saveProjectToDatabase(ProjectStore);

	await invoke('set_menu_item_enabling_status', {
		menuId: 'save_project',
		enabled: false
	});
}
