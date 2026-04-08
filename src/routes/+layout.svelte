<script lang="ts">
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import '../styles/page.css';
	import AppBlocker from '../modules/blocker/index.svelte';
	import Navbar from '../modules/navbar/navbar.svelte';
	import { destroyGlobalEvents, initGlobalEvents } from '../events';
	import AppStore from '../persistence/stores/app/store.svelte';
	import { isAuthenticated } from '../modules/login/commands/IsAuthenticated';
	import { appActions } from '../persistence/stores/app/actions';
	import { reportCaughtClientError } from '$lib/errors/globalClientErrors';
	import { getLicense } from '../modules/license/commands/GetLicense';
	import { SubscriptionStatus } from '../modules/license/types/License';
	import { lockAppUsage } from '../modules/launch/operations/lockAppUsage';
	import { Config, configContext } from '../modules/config/context.svelte';

	let { children }: { children: Snippet } = $props();

	/** Single shared instance for Navbar (this layout) and workspace `App` + descendants. */
	configContext.set(new Config());

	const appStore = AppStore.getState();

	onMount(async () => {
		await initGlobalEvents();

		try {
			const isUserAuthenticated = await isAuthenticated();

			appActions.setIsAuthenticated(isUserAuthenticated);
			appActions.setUnauthenticatedInStartup(!isUserAuthenticated);

			if (!isUserAuthenticated) {
				return;
			}
		} catch (err) {
			reportCaughtClientError(err);

			lockAppUsage();
		}

		try {
			const license = await getLicense();

			appActions.setLicenseInactiveInStartup(
				license.status === SubscriptionStatus.Inactive ||
					license.status === SubscriptionStatus.Paused
			);
			appActions.storeLicense(license);
		} catch (err) {
			reportCaughtClientError(err);

			lockAppUsage();
		}
	});

	onDestroy(destroyGlobalEvents);

	document.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	document.addEventListener('dragenter', (event) => {
		event.preventDefault();
	});
</script>

<main class="container flex h-screen flex-col overflow-hidden">
	<Navbar disabled={appStore.navbarDisabled} />
	<div class="flex min-h-0 flex-1 flex-col">
		{@render children()}
	</div>
</main>

{#if AppStore.showLoginBlocker || AppStore.errorInStartup}
	<AppBlocker
		title={appStore.blocker.title}
		message={appStore.blocker.message}
		showLoginButton={!AppStore.errorInStartup}
	/>
{:else if AppStore.showLicenseBlocker}
	<AppBlocker variant="license" />
{/if}
