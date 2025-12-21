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
		duration: number;
		handleDragStart: (event: DragEvent) => void;
		handleDragEnd: (event: DragEvent) => void;
		eventCategoriesById: Record<string, Category>;
		eventsByCategory: Record<string, RangeDataWithTags[]>;
		eventButtonsById: Record<string, Button>;
		eventsPlaying: SvelteMap<string, RangeDataWithTags>;
		eventSelected: string | null;
		onEventClick: (eventId: string) => void;
		onTimeChange: (time: number) => void;
		isDraggingTimeMarker: boolean;
		handleDraggingTimeMarker: (isDragging: boolean) => void;
	};

	let {
		currentTime = $bindable(),
		timelineStart,
		timelineEnd,
		relativeProgress,
		leftLimitTime,
		visibleDuration,
		duration,
		handleDragStart,
		handleDragEnd,
		eventCategoriesById,
		eventsByCategory,
		eventButtonsById,
		eventsPlaying,
		eventSelected,
		onEventClick,
		onTimeChange,
		isDraggingTimeMarker,
		handleDraggingTimeMarker
	}: Props = $props();

	// Time marker drag state
	let progressBarElement: HTMLButtonElement | null = $state(null);

	/* ==================== EVENT HANDLERS ==================== */

	function onProgressBarClick(event: MouseEvent) {
		if (isDraggingTimeMarker) {
			return;
		}

		const target = event.target as HTMLElement;

		if (target.id === 'time-marker' || target.closest('#time-marker')) {
			return;
		}

		if (
			target.closest('[role="button"]') &&
			target.closest('[role="button"]') !== progressBarElement
		) {
			return;
		}

		// Use the progress bar button element to calculate position
		if (!progressBarElement) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		// Calculate click position relative to the progress bar button
		const rect = progressBarElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const fullWidth = rect.width;

		// Clamp x to valid range
		if (x < 0 || x > fullWidth) {
			return;
		}

		// Map click position to time within visible range
		let newTime = mapClickToVisibleTime(x, fullWidth, leftLimitTime, visibleDuration);

		// Clamp time to valid range
		if (newTime < 0.1) {
			newTime = 0.1;
		}
		if (newTime > duration) {
			newTime = duration;
		}

		currentTime = newTime;
		onTimeChange(newTime);
	}

	// Handle time marker drag
	function onMarkerMouseDown(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		handleDraggingTimeMarker(true);

		function onMouseMove(moveEvent: MouseEvent) {
			if (!progressBarElement) return;

			const rect = progressBarElement.getBoundingClientRect();
			const x = moveEvent.clientX - rect.left;
			const fullWidth = rect.width;

			// Clamp x to valid range
			const clampedX = Math.max(0, Math.min(x, fullWidth));

			// Map mouse position to time within visible range
			let newTime = mapClickToVisibleTime(clampedX, fullWidth, leftLimitTime, visibleDuration);

			// Clamp time to valid range
			if (newTime < 0.1) {
				newTime = 0.1;
			}

			currentTime = newTime;
			onTimeChange(newTime);
		}

		function onMouseUp() {
			handleDraggingTimeMarker(false);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}
</script>

<div class="custom-scrollbar overflow-y my-1 flex min-h-0 flex-1 flex-col overflow-x-hidden">
	<button
		aria-label="Progress Bar"
		bind:this={progressBarElement}
		ondragstart={handleDragStart}
		ondragend={handleDragEnd}
		onclick={onProgressBarClick}
		draggable="true"
		class="relative"
	>
		<!-- Event categories -->
		{#if Object.entries(eventCategoriesById).length > 0}
			<div class="mt-2 mb-1 flex flex-col items-start gap-2">
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
				class="absolute top-0 left-0 z-10 h-full w-[2px] cursor-ew-resize rounded-full bg-sky-400 transition-all"
				style="left: clamp(0%, {relativeProgress * 100}%, calc(100% - 2px))"
				onmousedown={onMarkerMouseDown}
				role="slider"
				aria-label="Time marker"
				aria-valuenow={currentTime}
				aria-valuemin={0}
				aria-valuemax={duration}
				tabindex="0"
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
