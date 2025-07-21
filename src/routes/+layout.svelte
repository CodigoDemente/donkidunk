<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { bindMenuEvents } from '../modules/menu';
	import '../styles/page.css';
	import Navbar from '../modules/navbar/navbar.svelte';
	import { destroyEvents, initEvents } from '../events';

	onMount(async () => {
		// Initialize the menu
		await bindMenuEvents();
		await initEvents();
	});

	onDestroy(() => {
		destroyEvents();
	});

	document.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	document.addEventListener('dragenter', (event) => {
		event.preventDefault();
	});
</script>

<main class="container">
	<Navbar />
	<slot />
</main>
