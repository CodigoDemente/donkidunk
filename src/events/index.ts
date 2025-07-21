import { ProjectEventHandler } from './project';
import { WindowEventHandler } from './window';

const projectEventHandler = new ProjectEventHandler();
const windowEventHandler = new WindowEventHandler();

export async function initEvents(): Promise<void> {
	await projectEventHandler.init();
	await windowEventHandler.init();
}

export function destroyEvents(): void {
	projectEventHandler.destroy();
	windowEventHandler.destroy();
}
