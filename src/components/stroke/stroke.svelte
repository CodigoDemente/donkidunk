<script lang="ts">
	import Tagtime from '../tagtime/tagtime.svelte';
	import type { Props } from './types';

	let {
		categoryId,
		allTagsByCategory,
		duration,
		boardCategoriesById,
		buttonsListById,
		playingObject,
		currentTime,
		onClick
	}: Props = $props();
</script>

<div class="relative h-5 w-full rounded-xs bg-gray-800">
	{#if allTagsByCategory[categoryId]}
		{#each allTagsByCategory[categoryId] as event (event.id)}
			<Tagtime
				start={event.timestamp.start}
				end={event.timestamp.end ? event.timestamp.end : currentTime}
				total={duration}
				color={boardCategoriesById[categoryId]?.color}
				name={buttonsListById[event.buttonId]?.name}
				onClick={() => onClick && playingObject === null && onClick(event.id)}
			/>
		{/each}
	{/if}
	{#if playingObject && categoryId === playingObject.categoryId}
		<Tagtime
			start={playingObject.timestamp.start}
			end={currentTime}
			total={duration}
			color={boardCategoriesById[categoryId]?.color}
			name={buttonsListById[playingObject.buttonId]?.name}
			onClick={() => {}}
		/>
	{/if}
</div>
