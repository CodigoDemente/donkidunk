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
	}
};
