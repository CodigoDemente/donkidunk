import AppStore from '../../../persistence/stores/app/store.svelte';

export function lockAppUsage() {
	AppStore.getState().errorInStartup = true;
	AppStore.getState().blocker = {
		title: 'There was an error during app launch',
		message: 'Try to restart the app. If the error persists, please contact support.'
	};
}
