<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import Eventline from '../../../components/eventline/eventline.svelte';
	import CategoryPlayer from '../../../components/categoryplayer/categoryplayer.svelte';
	import type { Button } from '../../board/types/Button';
	import type { Category } from '../../board/types/Category';
	import type { RangeDataWithTags } from '../types/RangeData';
	import { calculateTimeFromPosition, shouldIgnoreClick } from '../utils/progressBarUtils';

	type Props = {
		currentTime: number;
		timelineStart: number;
		timelineEnd: number;
		relativeProgress: number;
		leftLimitTime: number;
		visibleDuration: number;
		duration: number;
		eventCategoriesById: Record<string, Category>;
		eventsByCategory: Record<string, RangeDataWithTags[]>;
		eventButtonsById: Record<string, Button>;
		eventsPlaying: SvelteMap<string, RangeDataWithTags>;
		eventSelected: string | null;
		onEventClick: (eventId: string, buttonId: string) => void;
		onEventDblClick: (startTimestamp: number, eventId: string, buttonId: string) => void;
		onEventResize: (
			eventId: string,
			buttonId: string,
			categoryId: string,
			newStart: number,
			newEnd: number
		) => void;
		onTimeChange: (time: number) => void;
		onCategoryPlay?: (categoryId: string) => void;
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
		eventCategoriesById,
		eventsByCategory,
		eventButtonsById,
		eventsPlaying,
		eventSelected,
		onEventClick,
		onEventDblClick,
		onEventResize,
		onTimeChange,
		onCategoryPlay,
		isDraggingTimeMarker,
		handleDraggingTimeMarker
	}: Props = $props();

	let progressBarElement: HTMLButtonElement | null = $state(null);
	let eventlinesContainer: HTMLDivElement | null = $state(null);

	/* ==================== PROGRESS BAR HANDLERS ==================== */

	function onProgressBarClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (shouldIgnoreClick(target, progressBarElement, isDraggingTimeMarker)) return;
		if (!progressBarElement) return;

		event.preventDefault();
		event.stopPropagation();

		const rect = progressBarElement.getBoundingClientRect();
		const newTime = calculateTimeFromPosition(
			event.clientX,
			rect,
			leftLimitTime,
			visibleDuration,
			duration
		);

		if (newTime >= 0) {
			currentTime = newTime;
			onTimeChange(newTime);
		}
	}

	// Time marker drag handlers
	function onMarkerDragStart(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		handleDraggingTimeMarker(true);

		function onMouseMove(moveEvent: MouseEvent) {
			if (!progressBarElement) return;

			const rect = progressBarElement.getBoundingClientRect();
			const newTime = calculateTimeFromPosition(
				moveEvent.clientX,
				rect,
				leftLimitTime,
				visibleDuration,
				duration
			);

			if (newTime >= 0) {
				currentTime = newTime;
				onTimeChange(newTime);
			}
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

<div class="custom-scrollbar overflow-y relative flex overflow-x-hidden">
	<div class="relative mt-2 mb-1 flex flex-col gap-2">
		{#each Object.keys(eventCategoriesById) as categoryId (categoryId)}
			{@const category = eventCategoriesById[categoryId]}
			<CategoryPlayer {category} onPlay={() => onCategoryPlay?.(categoryId)} />
		{/each}
	</div>
	<button
		aria-label="Progress Bar"
		bind:this={progressBarElement}
		onclick={onProgressBarClick}
		class="relative flex-1"
	>
		<!-- Event categories -->
		{#if Object.entries(eventCategoriesById).length > 0}
			<div
				bind:this={eventlinesContainer}
				class="relative mt-2 mb-1 flex flex-col items-start gap-2"
			>
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
						{onEventClick}
						{onEventDblClick}
						{onEventResize}
					/>
				{/each}

				<!-- Time marker (cursor) - Inside eventlines container to span full height -->
				{#if relativeProgress >= 0 && relativeProgress <= 1 && eventlinesContainer}
					<div
						id="time-marker"
						class="absolute top-0 left-0 z-10 w-[2px] cursor-ew-resize rounded-full bg-sky-400 transition-all"
						style="left: clamp(0%, {relativeProgress * 100}%, calc(100% - 2px)); height: 100%;"
						onmousedown={onMarkerDragStart}
						role="slider"
						aria-label="Time marker"
						aria-valuenow={currentTime}
						aria-valuemin={0}
						aria-valuemax={duration}
						tabindex="0"
					></div>
				{/if}
			</div>
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
