/**
 * Timeline State
 * Pure functions for computing derived timeline state
 */

import {
	calculateTimelineLimits,
	calculateRelativeProgress,
	type TimelineLimits
} from '../utils/zoomCalculations';

/**
 * Compute the timeline limits from duration and zoom range
 */
export function computeTimelineLimits(
	duration: number,
	timelineStart: number,
	timelineEnd: number
): TimelineLimits {
	return calculateTimelineLimits(duration, timelineStart, timelineEnd);
}

/**
 * Compute the relative progress within the visible range
 */
export function computeRelativeProgress(
	currentTime: number,
	leftLimitTime: number,
	rightLimitTime: number,
	visibleDuration: number
): number {
	return calculateRelativeProgress(currentTime, leftLimitTime, rightLimitTime, visibleDuration);
}
