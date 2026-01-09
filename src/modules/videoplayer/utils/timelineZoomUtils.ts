/**
 * Timeline Zoom Controller
 * Manages the zoom and scroll functionality for the video timeline
 */

export interface TimelineZoomState {
	start: number;
	end: number;
}

export interface DragState {
	isDraggingStart: boolean;
	isDraggingEnd: boolean;
	isDraggingBar: boolean;
	dragStartX: number;
	initialStart: number;
	initialEnd: number;
}

export interface TimelineLimits {
	leftLimitTime: number;
	rightLimitTime: number;
	visibleDuration: number;
}

/**
 * Calculate timeline limits based on zoom range
 */
export function calculateTimelineLimits(
	duration: number,
	start: number,
	end: number
): TimelineLimits {
	const leftLimitTime = duration * start;
	const rightLimitTime = duration * end;
	const visibleDuration = rightLimitTime - leftLimitTime;

	return {
		leftLimitTime,
		rightLimitTime,
		visibleDuration
	};
}

/**
 * Calculate relative progress within visible range
 */
export function calculateRelativeProgress(
	currentTime: number,
	leftLimitTime: number,
	rightLimitTime: number,
	visibleDuration: number
): number {
	return (currentTime - leftLimitTime) / visibleDuration;
}

/**
 * Center the timeline range around a specific time
 */
export function centerTimeInRange(
	time: number,
	duration: number,
	currentStart: number,
	currentEnd: number
): TimelineZoomState {
	const rangeWidth = currentEnd - currentStart;
	const timePercentage = time / duration;

	// Try to center the cursor (with 10% offset from left)
	let newStart = timePercentage - rangeWidth * 0.1;
	let newEnd = timePercentage + rangeWidth * 0.9;

	// Adjust if out of bounds
	if (newStart < 0) {
		newStart = 0;
		newEnd = rangeWidth;
	} else if (newEnd > 1) {
		newEnd = 1;
		newStart = 1 - rangeWidth;
	}

	return { start: newStart, end: newEnd };
}

/**
 * Handle timeline bar click to jump to position
 */
export function handleTimelineBarJump(
	clickX: number,
	barWidth: number,
	currentStart: number,
	currentEnd: number
): TimelineZoomState {
	const clickPercentage = clickX / barWidth;
	const rangeWidth = currentEnd - currentStart;

	// Center range around click position
	let newStart = clickPercentage - rangeWidth / 2;
	let newEnd = clickPercentage + rangeWidth / 2;

	// Adjust if out of bounds
	if (newStart < 0) {
		newStart = 0;
		newEnd = rangeWidth;
	} else if (newEnd > 1) {
		newEnd = 1;
		newStart = 1 - rangeWidth;
	}

	return { start: newStart, end: newEnd };
}

/**
 * Handle mouse move during drag operations
 */
export function handleDragMove(
	mouseX: number,
	barWidth: number,
	dragState: DragState,
	currentStart: number,
	currentEnd: number
): TimelineZoomState | null {
	const percentage = mouseX / barWidth;

	if (dragState.isDraggingStart) {
		// Limit between 0 and end - 1
		const newStart = Math.max(0, Math.min(percentage, currentEnd - 1));
		return { start: newStart, end: currentEnd };
	} else if (dragState.isDraggingEnd) {
		// Limit between start + 1 and 100
		const newEnd = Math.max(currentStart + 0.01, Math.min(percentage, 1));
		return { start: currentStart, end: newEnd };
	} else if (dragState.isDraggingBar) {
		// Move both handles maintaining distance
		const barRangeWidth = dragState.initialEnd - dragState.initialStart;
		const currentPercentage = dragState.dragStartX / barWidth;
		const delta = percentage - currentPercentage;

		let newStart = dragState.initialStart + delta;
		let newEnd = dragState.initialEnd + delta;

		// Ensure it doesn't go out of bounds
		if (newStart < 0) {
			newStart = 0;
			newEnd = barRangeWidth;
		} else if (newEnd > 1) {
			newEnd = 1;
			newStart = 1 - barRangeWidth;
		}

		return { start: newStart, end: newEnd };
	}

	return null;
}

/**
 * Map click position to time within visible range
 */
export function mapClickToVisibleTime(
	clickX: number,
	buttonWidth: number,
	leftLimitTime: number,
	visibleDuration: number
): number {
	const percentage = clickX / buttonWidth;
	return leftLimitTime + percentage * visibleDuration;
}

/**
 * Check if auto-scroll should be triggered
 */
export function shouldAutoScroll(
	isPlaying: boolean,
	relativeProgress: number,
	isAutoScrolling: boolean,
	isDragging: boolean
): boolean {
	return isPlaying && relativeProgress >= 0.99 && !isAutoScrolling && !isDragging;
}

/**
 * Check if should center on play
 */
export function shouldCenterOnPlay(
	isPlaying: boolean,
	wasPlaying: boolean,
	relativeProgress: number,
	isAutoScrolling: boolean
): boolean {
	const justStartedPlaying = isPlaying && !wasPlaying;
	const isOutOfRange = relativeProgress <= 0 || relativeProgress >= 1;
	return justStartedPlaying && isOutOfRange && !isAutoScrolling;
}

/**
 * Handle mirrored drag for handles (Premiere Pro style)
 * Complex logic that adapts based on marker visibility and position
 */
export function handleMirroredDrag(
	mouseX: number,
	movementX: number,
	barWidth: number,
	dragState: DragState,
	currentStart: number,
	currentEnd: number,
	currentTime: number,
	duration: number
): TimelineZoomState | null {
	const currentStartTime = currentStart * duration;
	const currentEndTime = currentEnd * duration;

	const relativeProgress = calculateRelativeProgress(
		currentTime,
		currentStart * duration,
		currentEnd * duration,
		(currentEnd - currentStart) * duration
	);
	const centerPercentage = 0.5;

	// Tolerance for "centered" detection (0.1% of range)
	const centerTolerance = 0.01;

	// Check if marker is visible in current range
	const isMarkerVisible = currentTime >= currentStartTime && currentTime <= currentEndTime;

	// Check if marker is centered (within tolerance)
	const isMarkerCentered = Math.abs(relativeProgress - centerPercentage) < centerTolerance;

	const delta = 0.001 * movementX;

	if (!delta) return null;

	const currentRange = currentEnd - currentStart;
	const deltaSignChange = dragState.isDraggingEnd ? -1 : 1;
	const changeToApply = 2 * deltaSignChange * delta;
	const newRange = currentRange - changeToApply;

	const currentTimePercentage = currentTime / duration;

	// Case 1a: Marker is centered, maintain geometric center
	if (isMarkerCentered) {
		if (newRange < 0.01 || newRange > 1) {
			return null;
		}

		let newStart = currentTimePercentage - newRange / 2;
		let newEnd = currentTimePercentage + newRange / 2;

		if (newStart < 0) {
			newStart = 0;
			newEnd = newRange;
		} else if (newEnd > 1) {
			newEnd = 1;
			newStart = 1 - newRange;
		}

		return { start: newStart, end: newEnd };
	}

	// Case 1b: The marker is not visible. Mirror move the delta amount from the geometric center
	if (!isMarkerVisible) {
		let newStart = currentStart + delta * deltaSignChange;
		let newEnd = currentEnd - delta * deltaSignChange;

		newStart = Math.max(0, Math.min(currentEnd - 0.01, newStart));
		newEnd = Math.max(currentStart + 0.01, Math.min(1, newEnd));

		return { start: newStart, end: newEnd };
	}

	// Case 2: Marker is visible but not centered
	// Subcase 1: We are moving handles towards the center
	if ((dragState.isDraggingStart && movementX > 0) || (dragState.isDraggingEnd && movementX < 0)) {
		let newStart = currentStart;
		let newEnd = currentEnd;

		// If the marker is to the right of the center, we move the start handle to the right
		if (relativeProgress > centerPercentage) {
			newStart += Math.abs(delta);
		}
		// If the marker is to the left of the center, we move the end handle to the left
		else {
			newEnd -= Math.abs(delta);
		}

		newStart = Math.min(currentEnd - 0.01, newStart);
		newEnd = Math.max(currentStart + 0.01, newEnd);

		return { start: newStart, end: newEnd };
	}
	// Subcase 2: We are moving handles away from the center
	else {
		let newStart = currentStart;
		let newEnd = currentEnd;

		// If the marker is to the right of the center, we move the end handle to the right
		if (relativeProgress > centerPercentage) {
			newEnd = currentEnd + Math.abs(delta);

			// If the end handle is out of bounds, we move the start handle to the left
			if (newEnd > 1) {
				newEnd = 1;
				newStart = Math.max(0, newStart - Math.abs(delta));
			}
		}
		// If the marker is to the left of the center, we move the start handle to the left
		else {
			newStart = currentStart - Math.abs(delta);

			// If the start handle is out of bounds, we move the end handle to the right
			if (newStart < 0) {
				newStart = 0;
				newEnd = Math.min(1, newEnd + Math.abs(delta));
			}
		}
		return { start: newStart, end: newEnd };
	}
}

/**
 * Handle zoom with mouse wheel (Premiere Pro style)
 * Zooms in/out trying to keep the current time marker centered
 */
export function handleZoomWheel(
	deltaY: number,
	currentTime: number,
	duration: number,
	currentStart: number,
	currentEnd: number,
	zoomSensitivity: number = 0.1
): TimelineZoomState {
	// Convert current time to percentage
	const currentTimePercentage = currentTime / duration;
	const currentRange = currentEnd - currentStart;

	// Calculate zoom factor (negative deltaY = zoom in, positive = zoom out)
	const zoomFactor = deltaY < 0 ? 1 - zoomSensitivity : 1 + zoomSensitivity;
	let newRange = currentRange * zoomFactor;

	// Limit zoom range (min 1%, max 100%)
	newRange = Math.max(0.01, Math.min(1, newRange));

	// Try to center the timeline marker in the new range
	let newStart = currentTimePercentage - newRange / 2;
	let newEnd = currentTimePercentage + newRange / 2;

	// Adjust if out of bounds
	if (newStart < 0) {
		newStart = 0;
		newEnd = Math.min(1, newRange);
	} else if (newEnd > 1) {
		newEnd = 1;
		newStart = Math.max(0, 1 - newRange);
	}

	return { start: newStart, end: newEnd };
}
