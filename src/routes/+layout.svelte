<script lang="ts">
	import { onMount } from 'svelte';
	import { buildMenu } from '../modules/menu';
	import '../styles/page.css';
	import Navbar from '../modules/navbar/navbar.svelte';

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
	<Navbar />
	<slot />
</main>

<style>
	.navbar {
		transition: width 0.3s ease; /* Smooth transition for width */
		overflow: hidden; /* Hide content when collapsed */
	}
	.navbar.open {
		width: 4rem; /* Full width when open */
	}
	.navbar.closed {
		width: 2rem; /* Collapsed width */
	}

	.content {
		transition:
			opacity 0.3s ease,
			visibility 0.3s ease; /* Smooth transition for visibility and opacity */
		opacity: 1;
		visibility: visible;
	}
	.content.hidden {
		opacity: 0;
		visibility: hidden;
	}
</style>
