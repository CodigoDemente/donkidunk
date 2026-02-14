import { debug } from '@tauri-apps/plugin-log';
import { listen } from '@tauri-apps/api/event';
import { createNewProject } from './operations/createProject';
import { openProject } from './operations/openProject';
import { saveProjectAs } from './operations/saveProjectAs';
import { saveProject } from './operations/saveProject';
import { importVideo } from './operations/importVideo';
import { undo } from './operations/undo';
import { redo } from './operations/redo';
import type { Board } from '../board/context.svelte';
import type { Timeline } from '../videoplayer/context.svelte';
import { saveButtonBoard } from './operations/saveButtonBoard';
import type { Config } from '../config/context.svelte';
import { closeProject } from './operations/closeProject';

type MenuEvent = {
	id: string;
};

export async function bindMenuEvents(board: Board, timeline: Timeline, config: Config) {
	listen<MenuEvent>('menu_event', async (event) => {
		debug(`Menu event triggered: ${event.id}`);
		switch (event.payload.id) {
			case 'new_project':
				await createNewProject(board, timeline, config);
				break;
			case 'open_project':
				await openProject(board, timeline, config);
				break;
			case 'save_project_as':
				await saveProjectAs();
				break;
			case 'save_project':
				await saveProject();
				break;
			case 'close_project':
				await closeProject(board, timeline);
				break;
			case 'import_video':
				await importVideo(timeline);
				break;
			case 'undo':
				undo();
				break;
			case 'redo':
				redo();
				break;
			case 'save_button_board':
				await saveButtonBoard(board, config);
				break;
			default:
				debug(`Unknown menu event: ${event.id}`);
		}
	});
}
