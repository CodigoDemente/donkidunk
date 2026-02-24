/**
 * Interaction Handlers
 * Handlers for complex interactions (zoom wheel)
 */

import { handleZoomWheel } from '../utils/zoomCalculations';

/**
 * Handle mouse wheel with Ctrl for zoom (works anywhere in timeline)
 */
export function onTimelineWheel(
	event: WheelEvent,
	currentTime: number,
	duration: number,
	timelineStart: number,
	timelineEnd: number,
	setTimelineStart: (start: number) => void,
	setTimelineEnd: (end: number) => void
): void {
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

	setTimelineStart(result.start);
	setTimelineEnd(result.end);
}
