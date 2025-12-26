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
	import { projectActions } from '../../persistence/stores/project/actions';
	import deleteEventModal from '../modalContent/deleteEventModal/index.svelte';

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

	/* ==================== DELETE EVENT LOGIC ==================== */

	// Handle Delete key to remove selected event
	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Ignore if typing in an input or textarea
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target instanceof HTMLElement && e.target.isContentEditable)
			) {
				return;
			}

			// Delete or Backspace key
			if ((e.key === 'Delete' || e.key === 'Backspace') && timeline.eventSelected) {
				e.preventDefault();
				const eventId = timeline.eventSelected;
				projectActions.setModal({
					content: deleteEventModal,
					title: 'Delete event',
					onCancel: () => projectActions.closeAndResetModal(),
					onSubmit: async () => {
						await timeline.removeEvent(eventId);
						projectActions.closeAndResetModal();
					},
					onSubmitText: 'Delete',
					show: true,
					size: 'small'
				});
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<div class="flex min-h-0 w-full flex-1 flex-col justify-between" onwheel={onTimelineWheel}>
	<div class="flex min-h-0 flex-col justify-start">
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
			onEventClick={timeline.setEventSelected.bind(timeline)}
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

	<!-- Tags box -->
	<Tagsbox />
</div>
