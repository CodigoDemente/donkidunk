<script lang="ts">
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from './context.svelte';
	import Tagsbox from './tagsbox.svelte';
	import TimeDisplay from './components/TimeDisplay.svelte';
	import TimelineMarkers from './components/TimelineMarkers.svelte';
	import TimelineZoomBar from './components/TimelineZoomBar.svelte';
	import TimelineProgressBar from './components/TimelineProgressBar.svelte';
	import {
		calculateTimelineLimits,
		calculateRelativeProgress,
		centerTimeInRange,
		shouldAutoScroll,
		shouldCenterOnPlay,
		handleZoomWheel
	} from './utils/timelineZoomUtils';
	import { isDeleteKey, shouldIgnoreKeyboardEvent } from './utils/progressBarUtils';

	type Props = {
		currentTime: number;
		duration: number;
		toTimeString: (time: number) => string;
		progress: number;
		isPlaying: boolean;
	};

	let {
		currentTime = $bindable(),
		duration,
		toTimeString,
		progress = $bindable(),
		isPlaying
	}: Props = $props();

	// Timeline zoom state (0-100 percentage range)
	let timelineStart = $state(0);
	let timelineEnd = $state(1);

	const board = boardContext.get();
	const timeline = timelineContext.get();

	let isDraggingTimeMarker = $state(false);

	/* ==================== EVENT HANDLERS ==================== */

	// Event handlers for timeline interactions
	function handleEventClick(eventId: string, buttonId: string) {
		// Check if button is playing
		if (!timeline.eventsPlaying.has(buttonId)) {
			timeline.setEventSelected(eventId);
		}
	}

	function handleEventDblClick(startTimestamp: number) {
		if (timeline.eventsPlaying.size > 0) return;
		currentTime = startTimestamp;
		handleTimeChange(startTimestamp);
	}

	async function handleEventResize(
		eventId: string,
		buttonId: string,
		categoryId: string,
		newStart: number,
		newEnd: number
	) {
		if (timeline.eventsPlaying.size > 0) return;
		await timeline.updateEvent(eventId, buttonId, categoryId, { start: newStart, end: newEnd });
	}

	/* ==================== DERIVED STATE ==================== */

	// Calculate timeline limits and progress
	const limits = $derived(calculateTimelineLimits(duration, timelineStart, timelineEnd));
	const relativeProgress = $derived(() =>
		calculateRelativeProgress(
			currentTime,
			limits.leftLimitTime,
			limits.rightLimitTime,
			limits.visibleDuration
		)
	);

	/* ==================== DRAGGING MARKER LOGIC ==================== */

	function handleDraggingTimeMarker(dragging: boolean) {
		isDraggingTimeMarker = dragging;
	}

	/* ==================== AUTO-SCROLL LOGIC ==================== */

	// Auto-scroll state
	let isAutoScrolling = $state(false);
	let wasPlaying = $state(false);

	// Center the timeline range around current time
	function applyCenterTime(time: number) {
		if (isAutoScrolling) return;
		isAutoScrolling = true;

		const result = centerTimeInRange(time, duration, timelineStart, timelineEnd);
		timelineStart = result.start;
		timelineEnd = result.end;

		setTimeout(() => {
			isAutoScrolling = false;
		}, 50);
	}

	// Handle range change from zoom bar
	function handleRangeChange(start: number, end: number) {
		timelineStart = start;
		timelineEnd = end;
	}

	// Handle time change from progress bar
	function handleTimeChange(time: number) {
		currentTime = time;
	}

	// Handle mouse wheel with Ctrl for zoom (works anywhere in timeline)
	function onTimelineWheel(event: WheelEvent) {
		// Only zoom if Ctrl is pressed
		if (!event.ctrlKey) return;

		event.preventDefault();
		event.stopPropagation();

		const result = handleZoomWheel(
			event.deltaY,
			currentTime,
			duration,
			timelineStart,
			timelineEnd,
			0.1
		);

		timelineStart = result.start;
		timelineEnd = result.end;
	}

	/* ==================== AUTO-SCROLL EFFECTS ==================== */

	// Auto-scroll when cursor reaches end of visible range (99%)
	$effect(() => {
		const progress = relativeProgress();

		if (shouldAutoScroll(isPlaying, progress, isAutoScrolling, isDraggingTimeMarker)) {
			applyCenterTime(currentTime);
		}
	});

	// Center timeline when play is pressed if cursor is out of visible range
	$effect(() => {
		const progress = relativeProgress();

		if (shouldCenterOnPlay(isPlaying, wasPlaying, progress, isAutoScrolling)) {
			applyCenterTime(currentTime);
		}

		wasPlaying = isPlaying;
	});

	// /* ==================== DELETE EVENT LOGIC ==================== */

	// Handle Delete key to remove selected event
	$effect(() => {
		async function handleKeyDown(e: KeyboardEvent) {
			if (shouldIgnoreKeyboardEvent(e)) return;
			if (!isDeleteKey(e.key) || !timeline.eventSelected) return;

			e.preventDefault();
			await timeline.removeEvent(timeline.eventSelected);
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div class="flex min-h-0 w-full flex-1 flex-col justify-between" onwheel={onTimelineWheel}>
	<div class="flex min-h-0 flex-col justify-start">
		<TimeDisplay {currentTime} {duration} {toTimeString} />

		<div class="flex w-full flex-row gap-2">
			<div class="flex flex-col pt-9">
				{#if Object.entries(board.eventCategoriesById).length > 0}
					{#each Object.keys(board.eventCategoriesById) as categoryId (categoryId)}
						<span class="h-5 text-sm text-gray-500"
							>{board.eventCategoriesById[categoryId].name}</span
						>
					{/each}
				{/if}
			</div>
			<div class="flex flex-1 flex-col">
				<TimelineMarkers
					leftLimitTime={limits.leftLimitTime}
					rightLimitTime={limits.rightLimitTime}
					visibleDuration={limits.visibleDuration}
					{toTimeString}
				/>
				<TimelineProgressBar
					bind:currentTime
					{timelineStart}
					{timelineEnd}
					relativeProgress={relativeProgress()}
					leftLimitTime={limits.leftLimitTime}
					visibleDuration={limits.visibleDuration}
					{duration}
					eventCategoriesById={board.eventCategoriesById}
					eventsByCategory={timeline.eventsByCategory}
					eventButtonsById={board.eventButtonsById}
					eventsPlaying={timeline.eventsPlaying}
					eventSelected={timeline.eventSelected}
					onEventClick={handleEventClick}
					onEventDblClick={handleEventDblClick}
					onEventResize={handleEventResize}
					onTimeChange={handleTimeChange}
					{isDraggingTimeMarker}
					{handleDraggingTimeMarker}
				/>
				<TimelineZoomBar
					bind:timelineStart
					bind:timelineEnd
					{currentTime}
					{duration}
					onRangeChange={handleRangeChange}
				/>
			</div>
		</div>
	</div>

	<!-- Tags box -->
	<Tagsbox />
</div>
