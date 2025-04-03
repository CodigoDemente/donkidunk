<script lang="ts">
	import { onMount } from 'svelte';
	import { buildMenu } from '../components/menu';
	import '../styles/page.css';

	onMount(() => {
		return buildMenu();
	});

	document.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	document.addEventListener('dragenter', (event) => {
		event.preventDefault();
	});
</script>

<main class="container">
	<slot />
</main>
