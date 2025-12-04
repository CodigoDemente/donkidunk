<script lang="ts">
	/**
	 * Video Timeline Component
	 * Main timeline component that orchestrates zoom, progress and auto-scroll
	 */

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
	} from './timelineZoom';

	type Props = {
		currentTime: number;
		duration: number;
		toTimeString: (time: number) => string;
		handleDragStart: (event: DragEvent) => void;
		handleDragEnd: (event: DragEvent) => void;
		progress: number;
		isPlaying: boolean;
	};

	let {
		currentTime = $bindable(),
		duration,
		toTimeString,
		handleDragStart,
		handleDragEnd,
		progress = $bindable(),
		isPlaying
	}: Props = $props();

	// Timeline zoom state (0-100 percentage range)
	let timelineStart = $state(0);
	let timelineEnd = $state(1);

	const board = boardContext.get();
	const timeline = timelineContext.get();

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
	// Track if user is dragging (derived from child component state)
	let isDragging = $state(false);

	// Auto-scroll when cursor reaches end of visible range (99%)
	$effect(() => {
		const progress = relativeProgress();

		if (shouldAutoScroll(isPlaying, progress, isAutoScrolling, isDragging)) {
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
</script>

<div class="flex max-h-[20vh] w-full flex-row" onwheel={onTimelineWheel}>
	<div class="flex w-full flex-col">
		<TimeDisplay {currentTime} {duration} {toTimeString} />

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
			{handleDragStart}
			{handleDragEnd}
			eventCategoriesById={board.eventCategoriesById}
			eventsByCategory={timeline.eventsByCategory}
			eventButtonsById={board.eventButtonsById}
			eventPlaying={timeline.eventPlaying}
			eventSelected={timeline.eventSelected}
			onEventClick={timeline.setEventSelected.bind(timeline)}
			onTimeChange={handleTimeChange}
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

<!-- Tags box -->
<div class="relative mt-2 max-h-[20vh] bg-gray-700">
	<Tagsbox />
</div>
