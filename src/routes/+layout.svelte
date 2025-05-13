<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { bindMenuEvents } from '../modules/menu';
	import '../styles/page.css';
	import Navbar from '../modules/navbar/navbar.svelte';
	import filePersistenceStore from '../persistence/file/index.svelte';

	onMount(async () => {
		// Initialize the menu
		bindMenuEvents();

		// Initialize file persistence
		await filePersistenceStore.initialize();
	});

	onDestroy(async () => {
		// Cleanup file persistence
		await filePersistenceStore.destroy();
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
