<script lang="ts">
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import '../styles/page.css';
	import AppBlocker from '../modules/blocker/index.svelte';
	import Navbar from '../modules/navbar/navbar.svelte';
	import { destroyGlobalEvents, initGlobalEvents } from '../events';
	import AppStore from '../persistence/stores/app/store.svelte';
	import { isAuthenticated } from '../modules/login/commands/IsAuthenticated';
	import { appActions } from '../persistence/stores/app/actions';

	let { children }: { children: Snippet } = $props();

	const appStore = AppStore.getState();

	onMount(async () => {
		await initGlobalEvents();

		const isUserAuthenticated = await isAuthenticated();

		appActions.setIsAuthenticated(isUserAuthenticated);

		appActions.setUnauthenticatedInStartup(!isUserAuthenticated);
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

{#if AppStore.showAppBlocker}
	<AppBlocker title={appStore.blocker.title} message={appStore.blocker.message} />
{/if}
