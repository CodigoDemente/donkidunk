import { SvelteDate } from 'svelte/reactivity';
import { type AppData } from './types/App';
import { SubscriptionStatus } from '../../../modules/license/types/License';

export const InitialAppData: AppData = {
	authentication: {
		isAuthenticated: false,
		unauthenticatedInStartup: true
	},
	subscription: {
		id: '',
		status: SubscriptionStatus.Inactive,
		expiresAt: new SvelteDate(Date.now() - 3600 * 1000), // 1 hour ago
		features: [],
		inactiveInStartup: true
	},
	blocker: {
		title: 'Your session has expired',
		message: 'To continue using the app, please log in again.'
	},
	errorInStartup: false,
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

	static get showLoginBlocker() {
		return (
			!appStore.authentication.isAuthenticated && !appStore.authentication.unauthenticatedInStartup
		);
	}

	static get showLicenseBlocker() {
		return !AppStore.isLicenseActive && !appStore.subscription.inactiveInStartup;
	}

	static get isLicenseActive() {
		return [SubscriptionStatus.Active, SubscriptionStatus.Trialing].includes(
			appStore.subscription.status
		);
	}

	static get errorInStartup() {
		return appStore.errorInStartup;
	}
}
