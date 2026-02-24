/**
 * Auto-Scroll Logic
 * Functions for auto-scrolling and centering the timeline
 */

import { centerTimeInRange, type TimelineZoomState } from '../utils/zoomCalculations';

/**
 * Apply center time to the timeline range.
 * Returns the new range or null if already auto-scrolling.
 */
export function applyCenterTime(
	time: number,
	duration: number,
	timelineStart: number,
	timelineEnd: number,
	isAutoScrolling: boolean
): TimelineZoomState | null {
	if (isAutoScrolling) return null;

	return centerTimeInRange(time, duration, timelineStart, timelineEnd);
}
