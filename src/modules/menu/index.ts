import { open, save } from '@tauri-apps/plugin-dialog';
import { copyFile } from '@tauri-apps/plugin-fs';
import { debug } from '@tauri-apps/plugin-log';
import { listen } from '@tauri-apps/api/event';
import {
	closeDatabase,
	loadProjectFromDatabase,
	openDatabase,
	saveProjectToDatabase
} from '../../persistence/database';
import { homeDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import ProjectStore from '../../persistence/stores/project/store.svelte';

type MenuEvent = {
	id: string;
};

export async function bindMenuEvents() {
	listen<MenuEvent>('menu_event', async (event) => {
		debug(`Menu event triggered: ${event.id}`);
		switch (event.payload.id) {
			case 'new_project':
				await createNewProject();
				break;
			case 'open_project':
				await openProject();
				break;
			case 'save_project_as':
				await saveProjectAs();
				break;
			case 'save_project':
				await saveProject();
				break;
			case 'import_video':
				await importVideo();
				break;
			default:
				debug(`Unknown menu event: ${event.id}`);
		}
	});
}

async function createNewProject() {
	debug('New project action triggered');

	const homePath = await homeDir();

	const path = await save({
		canCreateDirectories: true,
		defaultPath: homePath,
		title: 'Save Donkidunk project',
		filters: [
			{
				extensions: ['dnk'],
				name: 'Donkidunk project file'
			}
		]
	});

	if (!path) {
		debug('No path selected');
		return;
	}

	await openDatabase(path, false, true);

	ProjectStore.file.newlyCreated = true;

	await enableSaveProject();
	await enableImportVideo();
}

async function openProject() {
	debug('Open project action triggered');
	const path = await open({
		directory: false,
		multiple: false,
		filters: [
			{
				name: 'Donkidunk project file',
				extensions: ['dnk']
			}
		]
	});

	if (path) {
		debug(`Selected path: ${path}`);

		await openDatabase(path, false);

		ProjectStore.file.newlyCreated = false;
	} else {
		debug('No path selected');
	}

	await loadProjectFromDatabase();

	await enableImportVideo();
}

async function importVideo() {
	debug('Import video action triggered');

	const path = await open({
		directory: false,
		multiple: false,
		filters: [
			{
				name: 'Video files',
				extensions: ['mp4']
			}
		]
	});

	if (path) {
		debug(`Selected video path: ${path}`);
		ProjectStore.video.path = path;
	} else {
		debug('No video path selected');
	}

	await enableSaveProject();
}

async function saveProjectAs() {
	const homePath = await homeDir();

	const path = await save({
		canCreateDirectories: true,
		defaultPath: homePath,
		title: 'Save Donkidunk project',
		filters: [
			{
				extensions: ['dnk'],
				name: 'Donkidunk project file'
			}
		]
	});

	if (!path) {
		debug('No path selected');
		return;
	}

	const currDbPath = ProjectStore.file.path;

	await closeDatabase();

	await copyFile(currDbPath, path);

	await openDatabase(path, false, false);

	await saveProject();
}

async function saveProject() {
	await saveProjectToDatabase(ProjectStore);

	await invoke('set_menu_item_enabling_status', {
		menuId: 'save_project',
		enabled: false
	});
}

async function enableImportVideo() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'import_video',
		enabled: true
	});
}

async function enableSaveProject() {
	return await invoke('set_menu_item_enabling_status', {
		menuId: 'save_project',
		enabled: true
	});
}
