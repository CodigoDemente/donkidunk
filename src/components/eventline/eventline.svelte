<script lang="ts">
	import { timelineContext } from '../../modules/videoplayer/context.svelte';
	import Clip from '../clip/clip.svelte';
	import type { Props } from './types';

	const timeline = timelineContext.get();

	type EventlineProps = Partial<Props> & {
		skeleton?: boolean;
	};

	let {
		categoryId = '',
		allTagsByCategory = {},
		timelineStart = 0,
		timelineEnd = 1,
		boardCategoriesById = {},
		buttonsListById = {},
		playingObjects,
		eventSelected,
		currentTime = 0,
		onEventClick = () => {},
		onEventDblClick = () => {},
		onEventResize = () => {},
		skeleton = false
	}: EventlineProps = $props();

	const leftLimit = $derived(timeline.duration * timelineStart);
	const rightLimit = $derived(timeline.duration * timelineEnd);

	// Function to check if an event is visible in the timeline range
	function isEventVisible(start: number, end: number | null | undefined): boolean {
		const eventEnd = end ?? currentTime;
		return start < rightLimit && eventEnd > leftLimit;
	}

	// Get other events for collision detection (excluding the current event)
	function getOtherEvents(currentEventId: string) {
		const events = allTagsByCategory[categoryId] || [];
		return events
			.filter((event) => event.id !== currentEventId)
			.map((event) => ({
				start: event.timestamp.start,
				end: event.timestamp.end ?? timeline.duration
			}));
	}
</script>

<div class="relative h-5 w-full rounded-xs bg-gray-900">
	{#if !skeleton}
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
						onClick={() => onEventClick(event.id, event.buttonId)}
						onDblClick={() => onEventDblClick(event.timestamp.start, event.id, event.buttonId)}
						onResize={(newStart, newEnd) =>
							onEventResize(event.id, event.buttonId, event.categoryId, newStart, newEnd)}
						otherEvents={getOtherEvents(event.id)}
					/>
				{/if}
			{/each}
		{/if}
		{#if playingObjects && playingObjects.size > 0}
			{#each playingObjects.entries() as [eventId, playingObject] (eventId)}
				{#if playingObject && categoryId === playingObject.categoryId}
					{@const originalStart = playingObject.timestamp.start}
					{@const isReversed = currentTime < originalStart}
					{@const clipStart = isReversed ? currentTime : originalStart}
					{@const clipEnd = isReversed ? originalStart : currentTime}
					{#if isEventVisible(clipStart, clipEnd)}
						<Clip
							start={clipStart}
							end={clipEnd}
							timelineStart={leftLimit}
							timelineEnd={rightLimit}
							color={boardCategoriesById[categoryId]?.color}
							borderColor={buttonsListById[playingObject.buttonId]?.color}
							name={buttonsListById[playingObject.buttonId]?.name}
							onClick={() => {}}
							onDblClick={() => onEventDblClick(originalStart, eventId, playingObject.buttonId)}
						/>
					{/if}
				{/if}
			{/each}
		{/if}
	{/if}
</div>
