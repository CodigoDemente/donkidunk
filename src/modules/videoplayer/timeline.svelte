<!--
	📋 PROPUESTA DE REORGANIZACIÓN DE ARQUITECTURA
	===============================================
	
	Este componente actualmente contiene muchos handlers y lógica que podrían
	ser mejor organizados. Ver ARCHITECTURE_PROPOSAL.md para la propuesta completa.
	
	Estructura propuesta:
	
	handlers/
	├── eventHandlers.ts      → handleEventClick, handleEventDblClick, handleEventResize
	├── timeHandlers.ts       → handleTimeChange, handleRangeChange, handleDraggingTimeMarker
	├── keyboardHandlers.ts   → handleDeleteEvent (effect), shouldIgnoreKeyboardEvent, isDeleteKey
	└── interactionHandlers.ts → onTimelineWheel
	
	logic/
	├── autoScroll.ts         → applyCenterTime, createAutoScrollEffect, createCenterOnPlayEffect
	└── timelineState.ts      → createTimelineLimits, createRelativeProgress (derived state)
	
	utils/
	├── timeCalculations.ts   → calculateTimeFromPosition, clampTime, mapClickToVisibleTime
	├── zoomCalculations.ts   → (renombrar timelineZoomUtils.ts)
	├── markerCalculations.ts → (renombrar timeMarkersUtils.ts)
	└── clickValidation.ts    → shouldIgnoreClick (mover desde progressBarUtils)
	
	Beneficios:
	- timeline.svelte se reduce de ~180 a ~50 líneas (solo orquestación)
	- Separación clara de responsabilidades
	- Mejor testabilidad (utils son funciones puras)
	- Más fácil de mantener y escalar
-->
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

	function handleEventDblClick(startTimestamp: number, eventId: string, buttonId: string) {
		if (timeline.eventsPlaying.size > 0) return;
		currentTime = startTimestamp;
		handleTimeChange(startTimestamp);
		if (!timeline.eventsPlaying.has(buttonId)) {
			timeline.setEventSelected(eventId);
		}
	}

	async function handleEventResize(
		eventId: string,
		buttonId: string,
		categoryId: string,
		newStart: number,
		newEnd: number
	) {
		if (timeline.eventsPlaying.size > 0) return;
		if (!timeline.eventsPlaying.has(buttonId)) {
			timeline.setEventSelected(eventId);
		}
		await timeline.updateEvent(eventId, buttonId, categoryId, { start: newStart, end: newEnd });
	}

	function handleCategoryPlayAll(categoryId: string) {
		timeline.playAllEventsFromCategory(categoryId);
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

	/* ==================== CATEGORY PLAYBACK LOGIC ==================== */

	// Monitor category playback and jump to next event when current finishes
	$effect(() => {
		if (timeline.currentPlaybackIndex < 0) return;

		const currentEvent = timeline.getNextEventInQueue();
		if (!currentEvent || currentEvent.timestamp.end === undefined) return;

		// Check if current time has reached the end of the current event
		if (currentTime >= currentEvent.timestamp.end) {
			timeline.moveToNextEvent();
		}
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
			onEventClick={handleEventClick}
			onEventDblClick={handleEventDblClick}
			onEventResize={handleEventResize}
			onTimeChange={handleTimeChange}
			onCategoryPlay={(categoryId) => {
				handleCategoryPlayAll(categoryId);
			}}
			{isDraggingTimeMarker}
			{handleDraggingTimeMarker}
			playingCategoryId={timeline.currentPlaybackCategoryId}
		/>
		<TimelineZoomBar
			bind:timelineStart
			bind:timelineEnd
			{currentTime}
			{duration}
			onRangeChange={handleRangeChange}
		/>
	</div>

	<!-- Tags box -->
	<Tagsbox />
</div>
