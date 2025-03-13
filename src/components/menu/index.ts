import { Menu, Submenu } from '@tauri-apps/api/menu';
import { open } from '@tauri-apps/plugin-dialog';
import { debug } from '@tauri-apps/plugin-log';
import ProjectStore from '../../stores/project.svelte';

export async function buildMenu() {
	const fileSubmenu = await Submenu.new({
		id: 'file-submenu',
		text: 'File',
		items: [
			{
				id: 'import-video',
				text: 'Import Video',
				enabled: true,
				action: (id) => {
					debug(`Action triggered for ${id}`);
					open({
						directory: false,
						multiple: false,
						filters: [
							{
								name: 'Video Files',
								extensions: ['mp4']
							}
						]
					}).then((path) => {
						if (path) {
							debug(`Selected path: ${path}`);
							ProjectStore.setVideoPath(path as string);
						} else {
							debug('No path selected');
						}
					});
				}
			}
		]
	});

	const menu = await Menu.new({
		id: 'main-menu',
		items: [fileSubmenu]
	});

	await menu.setAsAppMenu();
}
