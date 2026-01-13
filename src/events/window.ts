import { getCurrentWindow } from '@tauri-apps/api/window';
import { closeDatabaseAndSaveChanges } from '../modules/menu/operations/closeProject';

export class WindowEventHandler {
	private unlisteners: (() => void)[] = [];

	constructor() {}

	async init(): Promise<void> {
		this.unlisteners.push(
			await getCurrentWindow().onCloseRequested(this.onCloseRequested.bind(this))
		);
	}

	destroy(): void {
		for (const unlistener of this.unlisteners) {
			unlistener();
		}
		this.unlisteners = [];
	}

	private async onCloseRequested(): Promise<void> {
		await closeDatabaseAndSaveChanges();
	}
}
