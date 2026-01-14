<script lang="ts">
	/**
	 * Timeline Zoom Bar Component
	 * Displays a draggable zoom range with start/end handles
	 */

	import {
		handleTimelineBarJump,
		handleDragMove,
		handleMirroredDrag,
		type DragState
	} from '../utils/timelineZoomUtils';

	type Props = {
		timelineStart: number;
		timelineEnd: number;
		currentTime: number;
		duration: number;
		onRangeChange: (start: number, end: number) => void;
	};

	let {
		timelineStart = $bindable(),
		timelineEnd = $bindable(),
		currentTime,
		duration,
		onRangeChange
	}: Props = $props();

	// Drag state
	let isDraggingStart = $state(false);
	let isDraggingEnd = $state(false);
	let isDraggingBar = $state(false);
	let justFinishedDrag = $state(false);
	let dragStartX = $state(0);
	let initialStart = $state(0);
	let initialEnd = $state(0);
	let timelineBarRef: HTMLElement;

	/* ==================== EVENT HANDLERS ==================== */

	// Handle drag start events
	function onStartHandleMouseDown(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDraggingStart = true;
	}

	function onEndHandleMouseDown(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDraggingEnd = true;
	}

	function onBarMouseDown(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDraggingBar = true;

		if (!timelineBarRef) return;
		const rect = timelineBarRef.getBoundingClientRect();
		dragStartX = event.clientX - rect.left;
		initialStart = timelineStart;
		initialEnd = timelineEnd;
	}

	// Handle mouse move during drag
	function onPointerMove(event: PointerEvent) {
		if (!isDraggingStart && !isDraggingEnd && !isDraggingBar) return;
		if (!timelineBarRef) return;

		const rect = timelineBarRef.getBoundingClientRect();
		const pointerX = event.clientX - rect.left;

		const dragState: DragState = {
			isDraggingStart,
			isDraggingEnd,
			isDraggingBar,
			dragStartX,
			initialStart,
			initialEnd
		};

		// Use mirrored drag for handles (Premiere Pro style)
		let result = null;
		if (isDraggingStart || isDraggingEnd) {
			result = handleMirroredDrag(
				pointerX,
				event.movementX || 0,
				rect.width,
				dragState,
				timelineStart,
				timelineEnd,
				currentTime,
				duration
			);
		} else if (isDraggingBar) {
			result = handleDragMove(pointerX, rect.width, dragState, timelineStart, timelineEnd);
		}

		if (result) {
			timelineStart = result.start;
			timelineEnd = result.end;
			onRangeChange(result.start, result.end);
		}
	}

	// Handle mouse up to end drag
	function onPointerCancel() {
		isDraggingStart = false;
		isDraggingEnd = false;
		isDraggingBar = false;
		justFinishedDrag = true;
	}

	// Handle click on timeline bar background to jump to position
	function onTimelineBarClick(event: MouseEvent) {
		// When dragging, just after the mouse up, an event click is triggered. We need to ignore it.
		if (justFinishedDrag) {
			justFinishedDrag = false;
			return;
		}
		const target = event.target as HTMLElement;

		// Only act if click was on the background (div with bind:this)
		if (target !== timelineBarRef) return;

		const rect = timelineBarRef.getBoundingClientRect();
		const clickX = event.clientX - rect.left;

		const result = handleTimelineBarJump(clickX, rect.width, timelineStart, timelineEnd);
		timelineStart = result.start;
		timelineEnd = result.end;
		onRangeChange(result.start, result.end);
	}

	// Handle double click to reset zoom (Premiere Pro style)
	function onTimelineBarDoubleClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		// Reset to full view
		timelineStart = 0;
		timelineEnd = 1;
		onRangeChange(0, 1);
	}

	/* ==================== EFFECTS ==================== */

	function onFullCompatiblePointerMove(pointerEvent: PointerEvent) {
		try {
			const allEvents = pointerEvent.getCoalescedEvents();

			for (const event of allEvents) {
				onPointerMove(event);
			}
		} catch (e: unknown) {
			if (e instanceof TypeError) {
				return onPointerMove(pointerEvent);
			}

			throw e;
		}
	}

	// Setup drag event listeners
	$effect(() => {
		if (isDraggingStart || isDraggingEnd || isDraggingBar) {
			window.addEventListener('pointermove', onFullCompatiblePointerMove);
			window.addEventListener('mouseup', onPointerCancel);

			return () => {
				window.removeEventListener('pointermove', onFullCompatiblePointerMove);
				window.removeEventListener('mouseup', onPointerCancel);
			};
		}
	});
</script>

<div class="ml-[var(--spacing-category-name-width)] rounded-md bg-gray-700">
	<div
		bind:this={timelineBarRef}
		class="relative h-2 w-full cursor-pointer rounded-md"
		onclick={onTimelineBarClick}
		ondblclick={onTimelineBarDoubleClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				onTimelineBarClick(e as unknown as MouseEvent);
				e.preventDefault();
			}
		}}
		role="slider"
		tabindex="0"
		aria-label="Timeline position (Double-click to reset)"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={timelineStart}
	>
		<!-- Resizable bar that follows the handles -->
		<div
			class="absolute top-0 h-full cursor-grab rounded-md bg-gray-500 transition-colors hover:bg-gray-400 active:cursor-grabbing"
			style="left: {timelineStart * 100}%; width: {(timelineEnd - timelineStart) * 100}%"
			onmousedown={onBarMouseDown}
			role="button"
			tabindex="0"
			aria-label="Drag timeline range"
		></div>
		<!-- Start handle -->
		<button
			class="absolute top-0 h-full w-2 cursor-ew-resize rounded-full bg-gray-300 transition-colors hover:bg-white"
			style="left: {timelineStart * 100}%"
			aria-label="Timeline Start"
			onmousedown={onStartHandleMouseDown}
		></button>
		<!-- End handle -->
		<button
			class="absolute top-0 h-full w-2 cursor-ew-resize rounded-full bg-gray-300 transition-colors hover:bg-white"
			style="right: {(1 - timelineEnd) * 100}%"
			aria-label="Timeline End"
			onmousedown={onEndHandleMouseDown}
		></button>
	</div>
</div>
