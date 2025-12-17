<script lang="ts">
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from './context.svelte';
	import Tag from '../../components/tag/tag.svelte';

	const board = boardContext.get();
	let isBoxOpen: boolean = $state(true);

	const timeline = timelineContext.get();
</script>

<!-- Line that toggles the box -->
<button
	class="mt-2 flex w-full cursor-pointer items-center rounded-t-md border-b border-gray-600 bg-gray-700 px-1 text-gray-200"
	onclick={() => (isBoxOpen = !isBoxOpen)}
>
	<p class="px-2 text-xs font-semibold">Tags related</p>
	<IconChevronDown
		class="ml-auto p-1 transition-transform duration-200"
		style="transform: {isBoxOpen ? 'rotate(180deg)' : 'rotate(0deg)'}"
	/>
</button>

{#if isBoxOpen}
	<div
		class="box-shadow mb-2 max-h-[18vh] overflow-y-auto rounded-md border border-gray-600 bg-gray-700 p-2 shadow-md"
	>
		<div class="flex flex-wrap gap-2">
			{#if timeline.eventsPlaying.size > 0}
				{#if Array.from(timeline.eventsPlaying)[timeline.eventsPlaying.size - 1][1].tagsRelated.length === 0}
					<p class="text-sm text-gray-400">No tags related to the current play.</p>
				{:else}
					{#each Array.from(timeline.eventsPlaying)[timeline.eventsPlaying.size - 1][1].tagsRelated || [] as tag (tag)}
						<Tag color={board.tagsById[tag]?.color} disabled text={board.tagsById[tag]?.name} />
					{/each}
				{/if}
			{:else if timeline.eventSelected}
				{#each timeline
					.getState()
					.eventTimeline.find((event) => event.id === timeline.eventSelected)?.tagsRelated ?? [] as tag (tag)}
					<Tag color={board.tagsById[tag]?.color} disabled text={board.tagsById[tag]?.name} />
				{/each}
			{:else}
				<p class="text-sm text-gray-400">No tags to show.</p>
			{/if}
		</div>
	</div>
{/if}
