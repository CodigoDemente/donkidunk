<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	/**
	 * Timeline Progress Bar Component
	 * Displays events and actions on the timeline with a time marker
	 */

	import Eventline from '../../../components/eventline/eventline.svelte';
	import type { Button } from '../../board/types/Button';
	import type { Category } from '../../board/types/Category';
	import { mapClickToVisibleTime } from '../timelineZoom';
	import type { RangeDataWithTags } from '../types/RangeData';

	type Props = {
		currentTime: number;
		timelineStart: number;
		timelineEnd: number;
		relativeProgress: number;
		leftLimitTime: number;
		visibleDuration: number;
		handleDragStart: (event: DragEvent) => void;
		handleDragEnd: (event: DragEvent) => void;
		eventCategoriesById: Record<string, Category>;
		eventsByCategory: Record<string, RangeDataWithTags[]>;
		eventButtonsById: Record<string, Button>;
		eventsPlaying: SvelteMap<string, RangeDataWithTags>;
		eventSelected: string | null;
		onEventClick: (eventId: string) => void;
		onTimeChange: (time: number) => void;
	};

	let {
		currentTime = $bindable(),
		timelineStart,
		timelineEnd,
		relativeProgress,
		leftLimitTime,
		visibleDuration,
		handleDragStart,
		handleDragEnd,
		eventCategoriesById,
		eventsByCategory,
		eventButtonsById,
		eventsPlaying,
		eventSelected,
		onEventClick,
		onTimeChange
	}: Props = $props();

	/* ==================== EVENT HANDLERS ==================== */

	// Handle click on progress bar (maps click to zoomed time range)
	function onProgressBarClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const target = event.target as HTMLElement;

		// If not a button, user clicked the time marker
		if (target.nodeName !== 'BUTTON') {
			return;
		}

		const fullWidth = target.offsetWidth;

		if (event.offsetX < 0 || event.offsetX > fullWidth) {
			return;
		}

		// Map click position to time within visible range
		let newTime = mapClickToVisibleTime(event.offsetX, fullWidth, leftLimitTime, visibleDuration);

		if (newTime < 0.1) {
			newTime = 0.1;
		}

		currentTime = newTime;
		onTimeChange(newTime);
	}
</script>

<div class="custom-scrollbar overflow-y my-1 flex max-h-40 flex-col overflow-x-hidden">
	<button
		aria-label="Progress Bar"
		ondragstart={handleDragStart}
		ondragend={handleDragEnd}
		ondrag={onProgressBarClick}
		onclick={onProgressBarClick}
		draggable="true"
		class="relative"
	>
		<!-- Event categories -->
		{#if Object.entries(eventCategoriesById).length > 0}
			<div class="mt-2 mb-4 flex flex-col items-start gap-2">
				{#each Object.keys(eventCategoriesById) as categoryId (categoryId)}
					<Eventline
						{categoryId}
						allTagsByCategory={eventsByCategory}
						{timelineStart}
						{timelineEnd}
						boardCategoriesById={eventCategoriesById}
						buttonsListById={eventButtonsById}
						playingObjects={eventsPlaying}
						{eventSelected}
						{currentTime}
						onClick={onEventClick}
					/>
				{/each}
			</div>
		{/if}

		<!-- Time marker (cursor) -->
		{#if relativeProgress >= 0 && relativeProgress <= 1}
			<div
				id="time-marker"
				class="absolute top-0 left-0 z-10 h-full w-px rounded-full bg-sky-400"
				style="left: {relativeProgress * 100}%"
			></div>
		{/if}
	</button>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar-track {
		-webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
		border-radius: 10px;
		background-color: #f5f5f5;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 5px;
		background-color: #f5f5f500;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		border-radius: 10px;
		-webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
		background-color: #8a8a8a;
	}
</style>
