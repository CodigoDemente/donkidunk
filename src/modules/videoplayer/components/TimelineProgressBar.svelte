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
		onEventDblClick: (startTimestamp: number) => void;
		onEventResize: (
			eventId: string,
			buttonId: string,
			categoryId: string,
			newStart: number,
			newEnd: number
		) => void;
		onTimeChange: (time: number) => void;
		onCategoryRewind?: (categoryId: string) => void;
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
		onCategoryRewind,
		isDraggingTimeMarker,
		handleDraggingTimeMarker
	}: Props = $props();

	let progressBarElement: HTMLButtonElement | null = $state(null);

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

<div class="custom-scrollbar overflow-y my-1 flex min-h-0 flex-1 flex-col overflow-x-hidden">
	<button
		aria-label="Progress Bar"
		bind:this={progressBarElement}
		onclick={onProgressBarClick}
		class="relative"
	>
		<!-- Event categories -->
		{#if Object.entries(eventCategoriesById).length > 0}
			<div class="mt-2 mb-1 flex flex-col items-start gap-2">
				{#each Object.keys(eventCategoriesById) as categoryId (categoryId)}
					{@const category = eventCategoriesById[categoryId]}
					<div class="flex w-full">
						<CategoryPlayer {category} onRewind={() => onCategoryRewind?.(categoryId)} />
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
					</div>
				{/each}
			</div>
		{/if}

		<!-- Time marker (cursor) -->
		{#if relativeProgress >= 0 && relativeProgress <= 1}
			<div
				id="time-marker"
				class="absolute top-0 left-0 z-10 ml-[var(--spacing-category-name-width)] h-full w-[2px] cursor-ew-resize rounded-full bg-sky-400 transition-all"
				style="left: clamp(0%, {relativeProgress * 100}%, calc(100% - 2px))"
				onmousedown={onMarkerDragStart}
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
