import { ProjectEventHandler } from './project';
import { UndoManagerEventHandler } from './undomanager';
import { WindowEventHandler } from './window';

const projectEventHandler = new ProjectEventHandler();
const windowEventHandler = new WindowEventHandler();
const undoManagerEventHandler = new UndoManagerEventHandler();

export async function initEvents(): Promise<void> {
	await projectEventHandler.init();
	await windowEventHandler.init();
	await undoManagerEventHandler.init();
}

export function destroyEvents(): void {
	projectEventHandler.destroy();
	windowEventHandler.destroy();
	undoManagerEventHandler.destroy();
}
