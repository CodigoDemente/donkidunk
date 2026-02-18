/**
 * Time Handlers
 * Handlers for time navigation and range changes
 */

/**
 * Handle time change from progress bar or navigation
 */
export function handleTimeChange(setCurrentTime: (time: number) => void, time: number): void {
	setCurrentTime(time);
}

/**
 * Handle range change from zoom bar
 */
export function handleRangeChange(
	setTimelineStart: (start: number) => void,
	setTimelineEnd: (end: number) => void,
	start: number,
	end: number
): void {
	setTimelineStart(start);
	setTimelineEnd(end);
}

/**
 * Handle dragging state of the time marker
 */
export function handleDraggingTimeMarker(
	setIsDragging: (dragging: boolean) => void,
	dragging: boolean
): void {
	setIsDragging(dragging);
}
