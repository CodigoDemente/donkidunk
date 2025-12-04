<script lang="ts">
	import { timelineContext } from '../../modules/videoplayer/context.svelte';
	import Clip from '../clip/clip.svelte';
	import type { Props } from './types';

	const timeline = timelineContext.get();

	let {
		categoryId,
		allTagsByCategory,
		timelineStart,
		timelineEnd,
		boardCategoriesById,
		buttonsListById,
		playingObjects,
		eventSelected,
		currentTime,
		onClick
	}: Props = $props();

	const leftLimit = $derived(timeline.duration * timelineStart);
	const rightLimit = $derived(timeline.duration * timelineEnd);

	// Función para verificar si un evento está visible en el rango del timeline
	function isEventVisible(start: number, end: number | null | undefined): boolean {
		const eventEnd = end ?? currentTime;
		// El evento es visible si hay algún solapamiento con el rango visible
		return start < rightLimit && eventEnd > leftLimit;
	}
</script>

<div class="relative h-5 w-full rounded-xs bg-gray-800">
	{#if allTagsByCategory[categoryId]}
		{#each allTagsByCategory[categoryId] as event (event.id)}
			{#if isEventVisible(event.timestamp.start, event.timestamp.end)}
				<Clip
					start={event.timestamp.start}
					end={event.timestamp.end ? event.timestamp.end : currentTime}
					timelineStart={leftLimit}
					timelineEnd={rightLimit}
					isSelected={eventSelected === event.id}
					color={boardCategoriesById[categoryId]?.color}
					borderColor={buttonsListById[event.buttonId]?.color}
					name={buttonsListById[event.buttonId]?.name}
					onClick={() =>
						onClick &&
						!playingObjects?.some((playingObject) => playingObject.buttonId === event.buttonId) &&
						onClick(event.id)}
				/>
			{/if}
		{/each}
	{/if}
	{#if playingObjects && playingObjects.length > 0}
		{#each playingObjects as playingObject}
			{#if playingObject && categoryId === playingObject.categoryId && isEventVisible(playingObject.timestamp.start, currentTime)}
				<Clip
					start={playingObject.timestamp.start}
					end={currentTime}
					timelineStart={leftLimit}
					timelineEnd={rightLimit}
					color={boardCategoriesById[categoryId]?.color}
					name={buttonsListById[playingObject.buttonId]?.name}
					onClick={() => {}}
				/>
			{/if}
		{/each}
	{/if}
</div>
