/**
 * Time Calculations
 * Pure utility functions for time-related calculations
 */

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
 * Clamp time value to valid range
 */
export function clampTime(time: number, min: number = 0.1, max: number): number {
	return Math.max(min, Math.min(max, time));
}

/**
 * Calculate time from mouse position on progress bar
 */
export function calculateTimeFromPosition(
	clientX: number,
	rect: DOMRect,
	leftLimitTime: number,
	visibleDuration: number,
	duration: number
): number {
	const x = clientX - rect.left;
	const fullWidth = rect.width;

	// Clamp x to valid range
	if (x < 0 || x > fullWidth) {
		return -1; // Invalid position
	}

	// Map click position to time within visible range
	const newTime = mapClickToVisibleTime(x, fullWidth, leftLimitTime, visibleDuration);

	// Clamp time to valid range
	return clampTime(newTime, 0.1, duration);
}
