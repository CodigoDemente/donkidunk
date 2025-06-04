import { debug } from '@tauri-apps/plugin-log';
import { listen } from '@tauri-apps/api/event';
import { createNewProject } from './operations/createProject';
import { openProject } from './operations/openProject';
import { saveProjectAs } from './operations/saveProjectAs';
import { saveProject } from './operations/saveProject';
import { importVideo } from './operations/importVideo';

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
