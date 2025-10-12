<script lang="ts">
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from './context.svelte';

	const board = boardContext.get();
	let isBoxOpen: boolean = $state(false);

	const timeline = timelineContext.get();
</script>

<!-- Line that toggles the box -->
<button
	class="flex w-full cursor-pointer items-center bg-gray-700 px-1 text-gray-200"
	onclick={() => (isBoxOpen = !isBoxOpen)}
>
	<p class="text-xs">Tags related</p>
	<IconChevronDown
		class="ml-auto p-1 transition-transform duration-200"
		style="transform: {isBoxOpen ? 'rotate(180deg)' : 'rotate(0deg)'}"
	/>
</button>

{#if isBoxOpen}
	<div class="rounded-md bg-gray-800 p-2 shadow-md">
		<div class="flex flex-wrap gap-2">
			{#if timeline.eventPlaying}
				{#if timeline.eventPlaying?.tagsRelated.length === 0}
					<p class="text-sm text-gray-400">No tags related to the current play.</p>
				{:else}
					{#each timeline.eventPlaying?.tagsRelated || [] as tag (tag)}
						<!-- TODO: replace and create Button component for all buttons -->
						<button
							class="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:bg-sky-600"
						>
							{board.tagsById[tag]?.name}
						</button>
					{/each}
				{/if}
			{:else if timeline.eventSelected}
				{#each timeline
					.getState()
					.eventTimeline.find((event) => event.id === timeline.eventSelected)?.tagsRelated ?? [] as tag (tag)}
					<button
						class="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:bg-sky-600"
					>
						{board.tagsById[tag]?.name}
					</button>
				{/each}
			{:else}
				<p class="text-sm text-gray-400">No tags to show.</p>
			{/if}
		</div>
	</div>
{/if}
