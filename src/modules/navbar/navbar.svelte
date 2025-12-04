<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';
	import {
		IconChevronLeft,
		IconChevronRight,
		IconFileScissors,
		IconTag
	} from '@tabler/icons-svelte';

	let isNavbarOpen = false;
	function toggleNavbar() {
		isNavbarOpen = !isNavbarOpen; // Toggle the navbar state
	}

	function navigateTo(page: RouteId) {
		goto(resolve(page)); // Navigate to the specified route
	}

	const isActive = (pageRoute: RouteId) => {
		return $page.route.id === pageRoute;
	};
</script>

<navbar
	class="navbarEffects relative overflow-hidden border-r-3 border-black bg-gray-900 {isNavbarOpen
		? 'w-28'
		: 'w-14'}"
>
	<ul class="contentEffects flex flex-col items-center gap-5 pt-26">
		<li class="border-b border-black">
			<button
				class={`flex items-center justify-center gap-2 rounded-sm p-2 hover:cursor-pointer ${isActive('/') ? 'bg-tertiary text-white' : 'text-tertiary'}`}
				type="button"
				onclick={() => navigateTo('/')}
			>
				<IconTag class="h-5 w-5" />
				{#if isNavbarOpen}
					<p class="buttonEffects text-sm">Board</p>
				{/if}
			</button>
		</li>
		<li class="border-b border-black">
			<button
				class={`flex items-center justify-center gap-2 rounded-sm p-2 hover:cursor-pointer ${isActive('/export') ? 'bg-tertiary text-white' : 'text-tertiary'}`}
				type="button"
				onclick={() => navigateTo('/export')}
			>
				<IconFileScissors class="h-6 w-6" />
				{#if isNavbarOpen}
					<p class="buttonEffects text-sm">Export</p>
				{/if}
			</button>
		</li>
		<!-- 
		This is commented out because this route doesn't exists yet and eslint complains about it
		<li>
			<button type="button" onclick={() => navigateTo('/graphics')}>Graphics</button>
		</li> 
		-->
	</ul>
</navbar>
<button
	class="buttonEffects absolute top-15 {isNavbarOpen
		? 'left-22'
		: 'left-11'} rounded-lg border border-white bg-black p-1 text-gray-200 hover:cursor-pointer hover:text-white"
	onclick={toggleNavbar}
	aria-label="Toggle Navbar"
>
	{#if isNavbarOpen}
		<IconChevronLeft class="h-3 w-3" />
	{:else}
		<IconChevronRight class="h-3 w-3" />
	{/if}
</button>

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

	.buttonEffects {
		transition: left 0.3s ease; /* Smooth transition for left position */
	}
</style>
