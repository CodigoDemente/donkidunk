<script lang="ts">
	import { onMount } from 'svelte';
	import { bindMenuEvents } from '../modules/menu';
	import '../styles/page.css';
	import Navbar from '../modules/navbar/navbar.svelte';

	onMount(() => {
		// Initialize the menu
		bindMenuEvents();
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
