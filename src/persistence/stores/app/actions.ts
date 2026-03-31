import { SvelteDate } from 'svelte/reactivity';
import { SubscriptionStatus, type License } from '../../../modules/license/types/License';
import AppStore from './store.svelte';

const appStore = AppStore.getState();

export const appActions = {
	getIsAuthenticated() {
		return appStore.authentication.isAuthenticated;
	},

	setIsAuthenticated(isAuthenticated: boolean) {
		appStore.authentication.isAuthenticated = isAuthenticated;
	},

	getUnauthenticatedInStartup() {
		return appStore.authentication.unauthenticatedInStartup;
	},

	setUnauthenticatedInStartup(unauthenticatedInStartup: boolean) {
		appStore.authentication.unauthenticatedInStartup = unauthenticatedInStartup;
	},

	storeLicense(license: License) {
		appStore.subscription = {
			...license,
			inactiveInStartup: appStore.subscription.inactiveInStartup
		};
	},

	resetLicense() {
		appStore.subscription = {
			...appStore.subscription,
			id: '',
			status: SubscriptionStatus.Inactive,
			expiresAt: new SvelteDate(Date.now() - 3600 * 1000), // 1 hour ago
			features: []
		};
	},

	getLicense() {
		return appStore.subscription;
	},

	getLicenseInactiveInStartup() {
		return appStore.subscription.inactiveInStartup;
	},

	setLicenseInactiveInStartup(licenseInactiveInStartup: boolean) {
		appStore.subscription.inactiveInStartup = licenseInactiveInStartup;
	}
};
