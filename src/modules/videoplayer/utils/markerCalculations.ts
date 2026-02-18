/**
 * Marker Calculations
 * Calculate appropriate time intervals and marker positions based on zoom level
 */

export interface TimeInterval {
	seconds: number;
	label: string;
}

/**
 * Get appropriate time interval based on visible duration
 * Adapts marker spacing as user zooms in/out
 */
export function getTimeInterval(visibleDuration: number): TimeInterval {
	// Convert duration to minutes for easier calculation
	const visibleMinutes = visibleDuration / 60;

	// Choose interval based on how much time is visible
	if (visibleMinutes > 60) {
		// More than 1 hour visible -> 15 minute markers
		return { seconds: 15 * 60, label: '15m' };
	} else if (visibleMinutes > 30) {
		// 30-60 minutes visible -> 10 minute markers
		return { seconds: 10 * 60, label: '10m' };
	} else if (visibleMinutes > 15) {
		// 15-30 minutes visible -> 5 minute markers
		return { seconds: 5 * 60, label: '5m' };
	} else if (visibleMinutes > 5) {
		// 5-15 minutes visible -> 1 minute markers
		return { seconds: 60, label: '1m' };
	} else if (visibleMinutes > 2) {
		// 2-5 minutes visible -> 30 second markers
		return { seconds: 30, label: '30s' };
	} else if (visibleMinutes > 1) {
		// 1-2 minutes visible -> 15 second markers
		return { seconds: 15, label: '15s' };
	} else {
		// Less than 1 minute visible -> 10 second markers
		return { seconds: 10, label: '10s' };
	}
}

/**
 * Generate marker positions for the visible range
 */
export function generateMarkerPositions(
	leftLimitTime: number,
	rightLimitTime: number,
	interval: number
): number[] {
	const positions: number[] = [];

	// Find the first marker position (round up to next interval)
	const firstMarker = Math.ceil(leftLimitTime / interval) * interval;

	// Generate all marker positions within visible range
	for (let time = firstMarker; time <= rightLimitTime; time += interval) {
		positions.push(time);
	}

	return positions;
}

/**
 * Calculate marker position as percentage within visible range
 */
export function getMarkerPercentage(
	markerTime: number,
	leftLimitTime: number,
	visibleDuration: number
): number {
	return ((markerTime - leftLimitTime) / visibleDuration) * 100;
}
