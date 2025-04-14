<script lang="ts">
	import { onMount } from 'svelte';
	import { buildMenu } from '../components/menu';
	import '../styles/page.css';
	import { goto } from '$app/navigation';

	onMount(() => {
		return buildMenu();
	});

	document.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	document.addEventListener('dragenter', (event) => {
		event.preventDefault();
	});

	let isNavbarOpen = true;
	function toggleNavbar() {
		isNavbarOpen = !isNavbarOpen; // Toggle the navbar state
	}

	function navigateTo(page: string) {
		goto(page); // Navigate to the specified route
	}
</script>

<main class="container">
	<navbar class="navbar {isNavbarOpen ? 'open' : 'closed'}">
		<button on:click={toggleNavbar} aria-label="Toggle Navbar">
			{isNavbarOpen ? '<' : '>'}
		</button>
		<ul class="content {isNavbarOpen ? 'visible' : 'hidden'}">
			<li>
				<button type="button" on:click={() => navigateTo('/')}>Board</button>
			</li>
			<li>
				<button type="button" on:click={() => navigateTo('/export')}>Export</button>
			</li>
			<li>
				<button type="button" on:click={() => navigateTo('/graphics')}>Graphics</button>
			</li>
		</ul>
	</navbar>
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
