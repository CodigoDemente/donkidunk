<script lang="ts">
	import { goto } from '$app/navigation';

	let isNavbarOpen = true;
	function toggleNavbar() {
		isNavbarOpen = !isNavbarOpen; // Toggle the navbar state
	}

	function navigateTo(page: string) {
		goto(page); // Navigate to the specified route
	}
</script>

<navbar class="navbarEffects overflow-hidden {isNavbarOpen ? 'w-16' : 'w-4'}">
	<button on:click={toggleNavbar} aria-label="Toggle Navbar">
		{isNavbarOpen ? '<' : '>'}
	</button>
	<ul class="contentEffects {isNavbarOpen ? 'visible opacity-100' : 'invisible opacity-0'}">
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

<style>
	.navbarEffects {
		transition: width 0.3s ease; /* Smooth transition for width */
		overflow: hidden; /* Hide content when collapsed */
	}

	.contentEffects {
		transition:
			opacity 0.3s ease,
			visibility 0.3s ease; /* Smooth transition for visibility and opacity */
	}
</style>
