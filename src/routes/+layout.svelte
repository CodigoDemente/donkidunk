<script lang="ts">
	import { onMount } from 'svelte';
	import { buildMenu } from '../components/menu';
	import '../styles/page.css';

	onMount(() => {
		return buildMenu();
	});
</script>

<main class="container">
	<slot />
</main>
