<script lang="ts">
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from './context.svelte';
	import Tagsbox from './components/tagsbox.svelte';
	import TimeDisplay from './components/timeline/TimeDisplay.svelte';
	import TimelineMarkers from './components/timeline/TimelineMarkers.svelte';
	import TimelineZoomBar from './components/timeline/TimelineZoomBar.svelte';
	import TimelineProgressBar from './components/timeline/TimelineProgressBar.svelte';

	// Handlers
	import {
		handleEventClick,
		handleEventBlur,
		handleEventDblClick,
		handleEventResize,
		handleCategoryPlayAll,
		handleEventContextMenu
	} from './handlers/eventHandlers';
	import { onTimelineWheel } from './handlers/interactionHandlers';
	import { shouldIgnoreKeyboardEvent, isDeleteKey } from './handlers/keyboardHandlers';

	// Logic
	import { applyCenterTime } from './logic/autoScroll';
	import { computeTimelineLimits, computeRelativeProgress } from './logic/timelineState';

	// Utils
	import { shouldAutoScroll, shouldCenterOnPlay } from './utils/zoomCalculations';
	import { configContext } from '../config/context.svelte';
	import { UIMode } from '../config/types/Config';

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

		// eslint-disable-next-line no-useless-assignment
		progress = $bindable(),
		isPlaying
	}: Props = $props();

	// Timeline zoom state (0-1 percentage range)
	let timelineStart = $state(0);
	let timelineEnd = $state(1);

	const board = boardContext.get();
	const timeline = timelineContext.get();
	const config = configContext.get();

	let isDraggingTimeMarker = $state(false);

	/* ==================== DERIVED STATE ==================== */

	const limits = $derived(computeTimelineLimits(duration, timelineStart, timelineEnd));
	const relativeProgress = $derived(() =>
		computeRelativeProgress(
			currentTime,
			limits.leftLimitTime,
			limits.rightLimitTime,
			limits.visibleDuration
		)
	);

	/* ==================== LOCAL HANDLERS (thin wrappers) ==================== */

	function onEventClick(eventId: string, buttonId: string) {
		handleEventClick(timeline, eventId, buttonId);
	}

	function onEventBlur() {
		handleEventBlur(timeline);
	}

	function onEventDblClick(startTimestamp: number, eventId: string, buttonId: string) {
		handleEventDblClick(timeline, startTimestamp, eventId, buttonId, onTimeChange);
	}

	async function onEventResize(
		eventId: string,
		buttonId: string,
		categoryId: string,
		newStart: number,
		newEnd: number
	) {
		await handleEventResize(timeline, eventId, buttonId, categoryId, newStart, newEnd);
	}

	function onCategoryPlay(categoryId: string) {
		handleCategoryPlayAll(timeline, categoryId);
	}

	async function onEventContextMenu(eventId: string) {
		await handleEventContextMenu(timeline, eventId);
	}

	function onDraggingTimeMarker(dragging: boolean) {
		isDraggingTimeMarker = dragging;
	}

	function onTimeChange(time: number) {
		currentTime = time;
	}

	function onRangeChange(start: number, end: number) {
		timelineStart = start;
		timelineEnd = end;
	}

	function onWheel(event: WheelEvent) {
		onTimelineWheel(
			event,
			currentTime,
			duration,
			timelineStart,
			timelineEnd,
			(s) => (timelineStart = s),
			(e) => (timelineEnd = e)
		);
	}

	/* ==================== AUTO-SCROLL LOGIC ==================== */

	let isAutoScrolling = $state(false);
	let wasPlaying = $state(false);

	function doApplyCenterTime(time: number) {
		if (isAutoScrolling) return;
		isAutoScrolling = true;

		const result = applyCenterTime(time, duration, timelineStart, timelineEnd, false);
		if (result) {
			timelineStart = result.start;
			timelineEnd = result.end;
		}

		setTimeout(() => {
			isAutoScrolling = false;
		}, 50);
	}

	/* ==================== EFFECTS ==================== */

	// Auto-scroll when cursor reaches end of visible range (99%)
	$effect(() => {
		const progress = relativeProgress();

		if (shouldAutoScroll(isPlaying, progress, isAutoScrolling, isDraggingTimeMarker)) {
			doApplyCenterTime(currentTime);
		}
	});

	// Center timeline when play is pressed if cursor is out of visible range
	$effect(() => {
		const progress = relativeProgress();

		if (shouldCenterOnPlay(isPlaying, wasPlaying, progress, isAutoScrolling)) {
			doApplyCenterTime(currentTime);
		}

		wasPlaying = isPlaying;
	});

	// Monitor category playback and jump to next event when current finishes
	$effect(() => {
		if (timeline.currentPlaybackIndex < 0) return;

		const currentEvent = timeline.getNextEventInQueue();
		if (!currentEvent || currentEvent.timestamp.end === undefined) return;

		if (currentTime >= currentEvent.timestamp.end) {
			timeline.moveToNextEvent();
		}
	});

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

<div class="flex min-h-0 w-full flex-1 flex-col justify-between" onwheel={onWheel}>
	<div class="mb-2 flex min-h-0 flex-col justify-start">
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
			{duration}
			eventCategoriesById={board.eventCategoriesById}
			eventsByCategory={timeline.eventsByCategory}
			eventButtonsById={board.eventButtonsById}
			eventsPlaying={timeline.eventsPlaying}
			eventSelected={timeline.eventSelected}
			{onEventClick}
			{onEventBlur}
			{onEventDblClick}
			{onEventResize}
			{onEventContextMenu}
			{onTimeChange}
			{onCategoryPlay}
			{isDraggingTimeMarker}
			handleDraggingTimeMarker={onDraggingTimeMarker}
			playingCategoryId={timeline.currentPlaybackCategoryId}
		/>
		<TimelineZoomBar bind:timelineStart bind:timelineEnd {currentTime} {duration} {onRangeChange} />
	</div>

	<!-- Tags box -->
	{#if config.uiMode === UIMode.Advanced}
		<Tagsbox />
	{/if}
</div>
