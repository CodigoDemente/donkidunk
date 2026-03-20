import type { AppData } from './types/App';

export const InitialAppData: AppData = {
	authentication: {
		isAuthenticated: false,
		unauthenticatedInStartup: true
	},
	blocker: {
		title: 'Your session has expired',
		message: 'To continue using the app, please log in again.'
	},
	navbarDisabled: true
};

let appStore: AppData = $state(InitialAppData);

export default class AppStore {
	static getState(): AppData {
		return appStore;
	}

	static setState(newState: AppData) {
		appStore = newState;
	}

	static reset() {
		Object.assign(appStore, structuredClone(InitialAppData));
	}

	static get showAppBlocker() {
		return (
			!appStore.authentication.isAuthenticated && !appStore.authentication.unauthenticatedInStartup
		);
	}
}
