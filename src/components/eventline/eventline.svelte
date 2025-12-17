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

	// Function to check if an event is visible in the timeline range
	function isEventVisible(start: number, end: number | null | undefined): boolean {
		const eventEnd = end ?? currentTime;
		// The event is visible if there is any overlap with the visible range
		return start < rightLimit && eventEnd > leftLimit;
	}

	function handleDblClick(startTimestamp: number) {
		if (playingObjects && playingObjects.size > 0) {
			return;
		}
		timeline.currentTime = startTimestamp;
	}
</script>

<div class="relative h-5 w-full rounded-xs bg-gray-900">
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
					onClick={() => onClick && !playingObjects?.has(event.buttonId) && onClick(event.id)}
					onDblClick={() => handleDblClick(event.timestamp.start)}
				/>
			{/if}
		{/each}
	{/if}
	{#if playingObjects && playingObjects.size > 0}
		{#each playingObjects.entries() as [eventId, playingObject] (eventId)}
			{#if playingObject && categoryId === playingObject.categoryId && isEventVisible(playingObject.timestamp.start, currentTime)}
				<Clip
					start={playingObject.timestamp.start}
					end={currentTime}
					timelineStart={leftLimit}
					timelineEnd={rightLimit}
					color={boardCategoriesById[categoryId]?.color}
					name={buttonsListById[playingObject.buttonId]?.name}
					onClick={() => {}}
					onDblClick={() => handleDblClick(playingObject.timestamp.start)}
				/>
			{/if}
		{/each}
	{/if}
</div>
