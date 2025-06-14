<script lang="ts">
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { timelineStore } from '../../persistence/stores/timeline/store.svelte';
	import { TimelineSelectors } from '../../persistence/stores/timeline/selectors.svelte';
	import { BoardSelectors } from '../../persistence/stores/board/selectors.svelte';

	let isBoxOpen: boolean = $state(false);

	$inspect(TimelineSelectors.getSelectedEvent());
	$inspect(BoardSelectors.getTagsById());
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
			{#if TimelineSelectors.getOnPlay()}
				{#if TimelineSelectors.getOnPlay()?.tagsRelated.length === 0}
					<p class="text-sm text-gray-400">No tags related to the current play.</p>
				{:else}
					{#each TimelineSelectors.getOnPlay()?.tagsRelated || [] as tag (tag)}
						<!-- TODO: replace and create Button component for all buttons -->
						<button
							class="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:bg-sky-600"
						>
							{BoardSelectors.getTagsById()[tag]?.name}
						</button>
					{/each}
				{/if}
			{:else if TimelineSelectors.getSelectedEvent()}
				{#each timelineStore.eventTimeline.find((event) => event.id === TimelineSelectors.getSelectedEvent())?.tagsRelated ?? [] as tag (tag)}
					<button
						class="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:bg-sky-600"
					>
						{BoardSelectors.getTagsById()[tag]?.name}
					</button>
				{/each}
			{:else}
				<p class="text-sm text-gray-400">No tags to show.</p>
			{/if}
		</div>
	</div>
{/if}
