<script lang="ts">
	import App from '../modules/app/index.svelte';
	import Login from '../modules/login/index.svelte';
	import { appActions } from '../persistence/stores/app/actions';
</script>

{#if !appActions.getUnauthenticatedInStartup()}
	<App />
{:else}
	<Login />
{/if}
