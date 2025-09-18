<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';

	let isNavbarOpen = false;
	function toggleNavbar() {
		isNavbarOpen = !isNavbarOpen; // Toggle the navbar state
	}

	function navigateTo(page: RouteId) {
		goto(resolve(page)); // Navigate to the specified route
	}
</script>

<navbar class="navbarEffects overflow-hidden {isNavbarOpen ? 'w-16' : 'w-4'}">
	<button onclick={toggleNavbar} aria-label="Toggle Navbar">
		{isNavbarOpen ? '<' : '>'}
	</button>
	<ul class="contentEffects {isNavbarOpen ? 'visible opacity-100' : 'invisible opacity-0'}">
		<li>
			<button type="button" onclick={() => navigateTo('/')}>Board</button>
		</li>
		<li>
			<button type="button" onclick={() => navigateTo('/export')}>Export</button>
		</li>
		<!-- 
		This is commented out because this route doesn't exists yet and eslint complains about it
		<li>
			<button type="button" onclick={() => navigateTo('/graphics')}>Graphics</button>
		</li> 
		-->
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
