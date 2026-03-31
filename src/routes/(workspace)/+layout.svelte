<script lang="ts">
	import type { Snippet } from 'svelte';
	import App from '../../modules/app/index.svelte';
	import Login from '../../modules/login/index.svelte';
	import License from '../../modules/license/index.svelte';
	import { appActions } from '../../persistence/stores/app/actions';

	let { children }: { children: Snippet } = $props();
</script>

{#if !appActions.getUnauthenticatedInStartup() && !appActions.getLicenseInactiveInStartup()}
	<App>
		{@render children()}
	</App>
{:else if appActions.getUnauthenticatedInStartup()}
	<Login />
{:else}
	<License />
{/if}
