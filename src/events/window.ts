import { getCurrentWindow } from '@tauri-apps/api/window';
import { closeDatabaseAndSaveChanges } from '../modules/menu/operations/closeProject';
import { LOGGED_IN_EVENT, LOGGED_OUT_EVENT, type LoginEvent } from './types/LoginEvent';
import { listen, type Event } from '@tauri-apps/api/event';
import { appActions } from '../persistence/stores/app/actions';

export class WindowEventHandler {
	private unlisteners: (() => void)[] = [];

	constructor() {}

	async init(): Promise<void> {
		this.unlisteners.push(
			await getCurrentWindow().onCloseRequested(this.onCloseRequested.bind(this))
		);

		this.unlisteners.push(
			await listen<LoginEvent>(LOGGED_IN_EVENT, this.onAuthStateChanged.bind(this))
		);

		this.unlisteners.push(
			await listen<LoginEvent>(LOGGED_OUT_EVENT, this.onAuthStateChanged.bind(this))
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

	private async onAuthStateChanged(event: Event<LoginEvent>) {
		const isAuthenticated = event.payload.isAuthenticated;

		if (isAuthenticated) {
			appActions.setUnauthenticatedInStartup(false);
		}

		appActions.setIsAuthenticated(isAuthenticated);
	}
}
