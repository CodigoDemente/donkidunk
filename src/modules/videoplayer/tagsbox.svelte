<script lang="ts">
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from './context.svelte';
	import Tag from '../../components/tag/tag.svelte';

	const board = boardContext.get();
	let isBoxOpen: boolean = $state(true);

	const timeline = timelineContext.get();
</script>

<div class="mb-2 flex flex-col">
	{#if isBoxOpen}
		<div
			class="box-shadow max-h-[30vh] shrink-0 overflow-y-auto rounded-t-md border-x border-t border-gray-600 bg-gray-700 p-2 shadow-md"
		>
			<div class="flex flex-wrap gap-2">
				{#if timeline.eventsPlaying.size > 0}
					{#if Array.from(timeline.eventsPlaying)[timeline.eventsPlaying.size - 1][1].tagsRelated.length === 0}
						<p class="text-base text-gray-400">No tags related to the current play.</p>
					{:else}
						{#each Array.from(timeline.eventsPlaying)[timeline.eventsPlaying.size - 1][1].tagsRelated || [] as tag (tag)}
							<Tag color={board.tagsById[tag]?.color} disabled text={board.tagsById[tag]?.name} />
						{/each}
					{/if}
				{:else if timeline.eventSelected}
					{#if timeline
						.getState()
						.eventTimeline.find((event) => event.id === timeline.eventSelected)?.tagsRelated?.length === 0}
						<p class="text-base text-gray-400">Add tags to the selected event.</p>
					{:else}
						{#each timeline
							.getState()
							.eventTimeline.find((event) => event.id === timeline.eventSelected)?.tagsRelated ?? [] as tag (tag)}
							<Tag color={board.tagsById[tag]?.color} disabled text={board.tagsById[tag]?.name} />
						{/each}
					{/if}
				{:else}
					<p class="text-base text-gray-400">Select an event to see its tags.</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Line that toggles the box -->
	<button
		class="flex w-full shrink-0 cursor-pointer items-center rounded-b-md border border-gray-600 bg-gray-700 px-1 text-gray-200"
		class:border-t-0={isBoxOpen}
		class:-mt-[1px]={isBoxOpen}
		onclick={() => (isBoxOpen = !isBoxOpen)}
	>
		<p class="px-2 text-base font-semibold">Tags related</p>
		<IconChevronDown
			class="ml-auto p-1 transition-transform duration-200"
			style="transform: {isBoxOpen ? 'rotate(0deg)' : 'rotate(180deg)'}"
		/>
	</button>
</div>
