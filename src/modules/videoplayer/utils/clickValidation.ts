/**
 * Click Validation
 * Utility functions for validating click targets
 */

/**
 * Check if click target should be ignored (e.g., time marker, buttons)
 */
export function shouldIgnoreClick(
	target: HTMLElement,
	progressBarElement: HTMLElement | null,
	isDraggingTimeMarker: boolean
): boolean {
	if (isDraggingTimeMarker) return true;
	if (target.id === 'time-marker' || target.closest('#time-marker')) return true;
	if (
		target.closest('[role="button"]') &&
		target.closest('[role="button"]') !== progressBarElement
	) {
		return true;
	}
	return false;
}
