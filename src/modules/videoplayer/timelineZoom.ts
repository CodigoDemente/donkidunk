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
	const leftLimitTime = duration * (start / 100);
	const rightLimitTime = duration * (end / 100);
	const visibleDuration = rightLimitTime - leftLimitTime;

	console.log('leftLimitTime', leftLimitTime);
	console.log('rightLimitTime', rightLimitTime);
	console.log('visibleDuration', visibleDuration);

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
	if (currentTime < leftLimitTime) return 0;
	if (currentTime > rightLimitTime) return 100;
	return ((currentTime - leftLimitTime) / visibleDuration) * 100;
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
	const timePercentage = (time / duration) * 100;

	// Try to center the cursor (with 10% offset from left)
	let newStart = timePercentage - rangeWidth * 0.1;
	let newEnd = timePercentage + rangeWidth * 0.9;

	// Adjust if out of bounds
	if (newStart < 0) {
		newStart = 0;
		newEnd = rangeWidth;
	} else if (newEnd > 100) {
		newEnd = 100;
		newStart = 100 - rangeWidth;
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
	const clickPercentage = (clickX / barWidth) * 100;
	const rangeWidth = currentEnd - currentStart;

	// Center range around click position
	let newStart = clickPercentage - rangeWidth / 2;
	let newEnd = clickPercentage + rangeWidth / 2;

	// Adjust if out of bounds
	if (newStart < 0) {
		newStart = 0;
		newEnd = rangeWidth;
	} else if (newEnd > 100) {
		newEnd = 100;
		newStart = 100 - rangeWidth;
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
	const percentage = (mouseX / barWidth) * 100;

	if (dragState.isDraggingStart) {
		// Limit between 0 and end - 1
		const newStart = Math.max(0, Math.min(percentage, currentEnd - 1));
		return { start: newStart, end: currentEnd };
	} else if (dragState.isDraggingEnd) {
		// Limit between start + 1 and 100
		const newEnd = Math.max(currentStart + 1, Math.min(percentage, 100));
		return { start: currentStart, end: newEnd };
	} else if (dragState.isDraggingBar) {
		// Move both handles maintaining distance
		const barRangeWidth = dragState.initialEnd - dragState.initialStart;
		const currentPercentage = (dragState.dragStartX / barWidth) * 100;
		const delta = percentage - currentPercentage;

		let newStart = dragState.initialStart + delta;
		let newEnd = dragState.initialEnd + delta;

		// Ensure it doesn't go out of bounds
		if (newStart < 0) {
			newStart = 0;
			newEnd = barRangeWidth;
		} else if (newEnd > 100) {
			newEnd = 100;
			newStart = 100 - barRangeWidth;
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
	return isPlaying && relativeProgress >= 99 && !isAutoScrolling && !isDragging;
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
	const isOutOfRange = relativeProgress <= 0 || relativeProgress >= 100;
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
	const percentage = (mouseX / barWidth) * 100;
	const timeMarkerPercentage = (currentTime / duration) * 100;
	const centerPercentage = (currentStart + currentEnd) / 2;

	// Tolerance for "centered" detection (0.1% of range)
	const centerTolerance = (currentEnd - currentStart) * 0.001;

	// Check if marker is visible in current range
	const isMarkerVisible =
		timeMarkerPercentage >= currentStart && timeMarkerPercentage <= currentEnd;

	// Check if marker is centered (within tolerance)
	const isMarkerCentered = Math.abs(timeMarkerPercentage - centerPercentage) < centerTolerance;

	if (dragState.isDraggingStart) {
		let newStart = Math.max(0, Math.min(percentage, 100));
		let delta = (newStart - currentStart) * movementX;

		// Case 1: Marker is outside view - maintain geometric center
		if (!isMarkerVisible || isMarkerCentered) {
			// Recompute limit and delta if we need to mirror move
			newStart = Math.min(newStart, currentEnd - 1);
			delta = Math.max(-0.5, Math.min((newStart - currentStart) * movementX, 0.5)); // Limit delta to -0.5 or 0.5

			// If we have been moving only the end handle, the start will be farther than the cursor, so we need to move
			// from the starting position, not from the cursor.
			newStart = Math.max(0, Math.min(newStart, currentStart + delta));

			let newEnd = currentEnd - delta;

			newEnd = Math.max(newStart + 1, Math.min(100, newEnd));
			return { start: newStart, end: newEnd };
		}

		// Case 2: Marker is visible but not centered
		// Always move the handle that is FARTHER from the marker
		const distanceFromStart = Math.abs(timeMarkerPercentage - currentStart);
		const distanceFromEnd = Math.abs(timeMarkerPercentage - currentEnd);

		// START is farther - we're dragging the far handle, move only it
		if (distanceFromStart > distanceFromEnd) {
			// Recompute limit and delta if we need to mirror move
			newStart = Math.min(newStart, currentEnd - 1);
			delta = Math.max(-0.5, Math.min((newStart - currentStart) * movementX, 0.5)); // Limit delta to -0.5 or 0.5

			// If we have been moving only the end handle, the start will be farther than the cursor, so we need to move
			// from the starting position, not from the cursor.
			newStart = Math.min(newStart, currentStart + delta);

			return { start: newStart, end: currentEnd };
		} else {
			// END is farther, we're draggin the far handle towards the marker
			delta = Math.max(-0.5, Math.min(delta, 0.5));

			const newEnd = Math.min(100, currentEnd - delta);

			return { start: currentStart, end: newEnd };
		}
	} else if (dragState.isDraggingEnd) {
		let newEnd = Math.max(0, Math.min(percentage, 100));
		let delta = (currentEnd - newEnd) * movementX;

		// Case 1: Marker is outside view - maintain geometric center
		if (!isMarkerVisible || isMarkerCentered) {
			console.log('marker center');
			// Recompute limit and delta if we need to mirror move
			newEnd = Math.max(newEnd, currentStart + 1);
			delta = Math.max(-0.5, Math.min(newEnd - currentEnd, 0.5)); // Limit delta to -0.5 or 0.5

			if (!delta) {
				return { start: currentStart, end: currentEnd };
			}

			// If we have been moving only the start handle, the end will be farther than the cursor, so we need
			// to move from the starting position, not from the cursor.
			newEnd = Math.max(0, Math.max(newEnd, newEnd + delta));

			let newStart = currentStart - delta;

			newStart = Math.min(currentEnd - 1, Math.max(newStart, 0));
			return { start: newStart, end: newEnd };
		}

		// Case 2: Marker is visible but not centered
		// Always move the handle that is FARTHER from the marker
		const distanceFromStart = Math.abs(timeMarkerPercentage - currentStart);
		const distanceFromEnd = Math.abs(timeMarkerPercentage - currentEnd);

		// END is farther - we're dragging the far handle, move only it
		if (distanceFromStart < distanceFromEnd) {
			// Recompute limit and delta if we need to mirror move
			newEnd = Math.max(newEnd, currentStart + 1);
			delta = Math.max(-0.5, Math.min((currentEnd - newEnd) * movementX, 0.5)); // Limit delta to -0.5 or 0.5

			// If we have been moving only the end handle, the start will be farther than the cursor, so we need to move
			// from the starting position, not from the cursor.
			newEnd = Math.max(newEnd, currentEnd + delta);

			return { start: currentStart, end: newEnd };
		} else {
			// START is farther, we're dragging the far handle towards the marker
			delta = Math.max(-0.5, Math.min(delta, 0.5));

			const newStart = Math.min(100, currentStart - delta);

			return { start: newStart, end: currentEnd };
		}
	}

	return null;
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
	const currentTimePercentage = (currentTime / duration) * 100;
	const currentRange = currentEnd - currentStart;

	// Calculate zoom factor (negative deltaY = zoom in, positive = zoom out)
	const zoomFactor = deltaY < 0 ? 1 - zoomSensitivity : 1 + zoomSensitivity;
	let newRange = currentRange * zoomFactor;

	// Limit zoom range (min 1%, max 100%)
	newRange = Math.max(1, Math.min(100, newRange));

	// Try to center the timeline marker in the new range
	let newStart = currentTimePercentage - newRange / 2;
	let newEnd = currentTimePercentage + newRange / 2;

	// Adjust if out of bounds
	if (newStart < 0) {
		newStart = 0;
		newEnd = Math.min(100, newRange);
	} else if (newEnd > 100) {
		newEnd = 100;
		newStart = Math.max(0, 100 - newRange);
	}

	return { start: newStart, end: newEnd };
}
