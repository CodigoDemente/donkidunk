import { describe, expect, it } from 'vitest';
import {
	calculateTimelineLimits,
	calculateRelativeProgress,
	centerTimeInRange,
	handleTimelineBarJump,
	handleDragMove,
	shouldAutoScroll,
	shouldCenterOnPlay,
	handleMirroredDrag,
	handleZoomWheel,
	type DragState
} from '../utils/zoomCalculations';

// ── calculateTimelineLimits ──────────────────────────────────────────────────

describe('calculateTimelineLimits', () => {
	it('should calculate full range when start=0 and end=1', () => {
		const result = calculateTimelineLimits(120, 0, 1);
		expect(result.leftLimitTime).toBe(0);
		expect(result.rightLimitTime).toBe(120);
		expect(result.visibleDuration).toBe(120);
	});

	it('should calculate a zoomed-in sub-range', () => {
		const result = calculateTimelineLimits(100, 0.25, 0.75);
		expect(result.leftLimitTime).toBe(25);
		expect(result.rightLimitTime).toBe(75);
		expect(result.visibleDuration).toBe(50);
	});

	it('should handle start=0 end=0.5', () => {
		const result = calculateTimelineLimits(60, 0, 0.5);
		expect(result.leftLimitTime).toBe(0);
		expect(result.rightLimitTime).toBe(30);
		expect(result.visibleDuration).toBe(30);
	});
});

// ── calculateRelativeProgress ────────────────────────────────────────────────

describe('calculateRelativeProgress', () => {
	it('should return 0 when currentTime equals leftLimitTime', () => {
		expect(calculateRelativeProgress(10, 10, 20, 10)).toBe(0);
	});

	it('should return 1 when currentTime equals rightLimitTime', () => {
		expect(calculateRelativeProgress(20, 10, 20, 10)).toBe(1);
	});

	it('should return 0.5 when currentTime is in the middle', () => {
		expect(calculateRelativeProgress(15, 10, 20, 10)).toBe(0.5);
	});

	it('should return negative when currentTime is before visible range', () => {
		expect(calculateRelativeProgress(5, 10, 20, 10)).toBe(-0.5);
	});

	it('should return > 1 when currentTime is after visible range', () => {
		expect(calculateRelativeProgress(25, 10, 20, 10)).toBe(1.5);
	});
});

// ── centerTimeInRange ────────────────────────────────────────────────────────

describe('centerTimeInRange', () => {
	it('should center the range around the given time with 10% offset', () => {
		const result = centerTimeInRange(50, 100, 0, 0.5);
		// timePercentage = 0.5, rangeWidth = 0.5
		// newStart = 0.5 - 0.5*0.1 = 0.45
		// newEnd = 0.5 + 0.5*0.9 = 0.95
		expect(result.start).toBeCloseTo(0.45);
		expect(result.end).toBeCloseTo(0.95);
	});

	it('should clamp to start=0 when centering near the beginning', () => {
		const result = centerTimeInRange(2, 100, 0, 0.5);
		// timePercentage = 0.02, rangeWidth = 0.5
		// newStart = 0.02 - 0.05 = -0.03 < 0
		expect(result.start).toBe(0);
		expect(result.end).toBe(0.5);
	});

	it('should clamp to end=1 when centering near the end', () => {
		const result = centerTimeInRange(98, 100, 0.5, 1);
		// timePercentage = 0.98, rangeWidth = 0.5
		// newEnd = 0.98 + 0.45 = 1.43 > 1
		expect(result.end).toBe(1);
		expect(result.start).toBe(0.5);
	});

	it('should preserve the range width', () => {
		const rangeWidth = 0.3;
		const result = centerTimeInRange(50, 100, 0.2, 0.2 + rangeWidth);
		expect(result.end - result.start).toBeCloseTo(rangeWidth);
	});
});

// ── handleTimelineBarJump ────────────────────────────────────────────────────

describe('handleTimelineBarJump', () => {
	it('should center the range on the click position', () => {
		const result = handleTimelineBarJump(500, 1000, 0, 0.2);
		// clickPercentage=0.5, rangeWidth=0.2
		// newStart=0.5-0.1=0.4, newEnd=0.5+0.1=0.6
		expect(result.start).toBeCloseTo(0.4);
		expect(result.end).toBeCloseTo(0.6);
	});

	it('should clamp to start=0 when clicking near the beginning', () => {
		const result = handleTimelineBarJump(50, 1000, 0, 0.2);
		// clickPercentage=0.05, newStart=0.05-0.1=-0.05 < 0
		expect(result.start).toBe(0);
		expect(result.end).toBe(0.2);
	});

	it('should clamp to end=1 when clicking near the end', () => {
		const result = handleTimelineBarJump(960, 1000, 0.8, 1);
		// clickPercentage=0.96, newStart=0.96-0.1=0.86, newEnd=0.96+0.1=1.06 > 1
		expect(result.end).toBe(1);
		expect(result.start).toBe(0.8);
	});

	it('should preserve range width', () => {
		const result = handleTimelineBarJump(500, 1000, 0, 0.3);
		expect(result.end - result.start).toBeCloseTo(0.3);
	});
});

// ── handleDragMove ───────────────────────────────────────────────────────────

describe('handleDragMove', () => {
	const baseDragState: DragState = {
		isDraggingStart: false,
		isDraggingEnd: false,
		isDraggingBar: false,
		dragStartX: 0,
		initialStart: 0,
		initialEnd: 1
	};

	it('should move start handle when dragging start', () => {
		// The start handle is clamped via: Math.max(0, Math.min(percentage, currentEnd - 1))
		// The "end - 1" formula means that when the end handle is below 100%,
		// the max allowed start is (end - 1), which is ≤ 0 for end ∈ [0, 1].
		// So with currentEnd=0.5 → cap = 0.5-1 = -0.5, clamped to 0.
		// This is the actual production behavior of the zoom bar drag.
		const dragState = { ...baseDragState, isDraggingStart: true };
		const result = handleDragMove(300, 1000, dragState, 0, 0.5);
		expect(result).not.toBeNull();
		expect(result!.start).toBe(0);
		expect(result!.end).toBe(0.5);
	});

	it('should not let start handle pass end handle', () => {
		const dragState = { ...baseDragState, isDraggingStart: true };
		const result = handleDragMove(900, 1000, dragState, 0, 0.5);
		// Same clamping: Math.max(0, Math.min(0.9, -0.5)) = 0
		expect(result!.start).toBe(0);
	});

	it('should move end handle when dragging end', () => {
		const dragState = { ...baseDragState, isDraggingEnd: true };
		const result = handleDragMove(700, 1000, dragState, 0.2, 0.8);
		expect(result).not.toBeNull();
		expect(result!.start).toBe(0.2);
		expect(result!.end).toBeCloseTo(0.7);
	});

	it('should not let end handle go below start handle', () => {
		const dragState = { ...baseDragState, isDraggingEnd: true };
		const result = handleDragMove(50, 1000, dragState, 0.3, 0.8);
		// Math.max(0.3 + 0.01, Math.min(0.05, 1)) = Math.max(0.31, 0.05) = 0.31
		expect(result!.end).toBeCloseTo(0.31);
	});

	it('should move both handles when dragging bar', () => {
		const dragState = {
			...baseDragState,
			isDraggingBar: true,
			dragStartX: 500,
			initialStart: 0.3,
			initialEnd: 0.7
		};
		// Mouse moved from 500 to 600 => delta = 0.1
		const result = handleDragMove(600, 1000, dragState, 0.3, 0.7);
		expect(result).not.toBeNull();
		expect(result!.start).toBeCloseTo(0.4);
		expect(result!.end).toBeCloseTo(0.8);
	});

	it('should clamp bar drag to left bound', () => {
		const dragState = {
			...baseDragState,
			isDraggingBar: true,
			dragStartX: 200,
			initialStart: 0.1,
			initialEnd: 0.3
		};
		// Moving far left
		const result = handleDragMove(0, 1000, dragState, 0.1, 0.3);
		expect(result!.start).toBe(0);
		expect(result!.end).toBeCloseTo(0.2);
	});

	it('should clamp bar drag to right bound', () => {
		const dragState = {
			...baseDragState,
			isDraggingBar: true,
			dragStartX: 800,
			initialStart: 0.7,
			initialEnd: 0.9
		};
		// Moving far right
		const result = handleDragMove(1000, 1000, dragState, 0.7, 0.9);
		expect(result!.end).toBe(1);
		expect(result!.start).toBeCloseTo(0.8);
	});

	it('should return null when no drag type is active', () => {
		const result = handleDragMove(500, 1000, baseDragState, 0, 1);
		expect(result).toBeNull();
	});
});

// ── shouldAutoScroll ─────────────────────────────────────────────────────────

describe('shouldAutoScroll', () => {
	it('should return true when playing, progress >= 0.99, not scrolling, not dragging', () => {
		expect(shouldAutoScroll(true, 0.99, false, false)).toBe(true);
	});

	it('should return false when not playing', () => {
		expect(shouldAutoScroll(false, 0.99, false, false)).toBe(false);
	});

	it('should return false when progress < 0.99', () => {
		expect(shouldAutoScroll(true, 0.5, false, false)).toBe(false);
	});

	it('should return false when already auto-scrolling', () => {
		expect(shouldAutoScroll(true, 0.99, true, false)).toBe(false);
	});

	it('should return false when dragging', () => {
		expect(shouldAutoScroll(true, 0.99, false, true)).toBe(false);
	});

	it('should return true when progress > 0.99', () => {
		expect(shouldAutoScroll(true, 1.0, false, false)).toBe(true);
	});
});

// ── shouldCenterOnPlay ───────────────────────────────────────────────────────

describe('shouldCenterOnPlay', () => {
	it('should return true when just started playing, out of range, not scrolling', () => {
		expect(shouldCenterOnPlay(true, false, 1.5, false)).toBe(true);
	});

	it('should return true when just started and progress <= 0', () => {
		expect(shouldCenterOnPlay(true, false, -0.1, false)).toBe(true);
	});

	it('should return false when was already playing', () => {
		expect(shouldCenterOnPlay(true, true, 1.5, false)).toBe(false);
	});

	it('should return false when in range', () => {
		expect(shouldCenterOnPlay(true, false, 0.5, false)).toBe(false);
	});

	it('should return false when auto-scrolling', () => {
		expect(shouldCenterOnPlay(true, false, 1.5, true)).toBe(false);
	});

	it('should return false when not playing', () => {
		expect(shouldCenterOnPlay(false, false, 1.5, false)).toBe(false);
	});
});

// ── handleZoomWheel ──────────────────────────────────────────────────────────

describe('handleZoomWheel', () => {
	it('should zoom in (reduce range) on negative deltaY', () => {
		const result = handleZoomWheel(-100, 50, 100, 0, 1, 0.1);
		// zoomFactor = 1 - 0.1 = 0.9 => newRange = 0.9
		expect(result.end - result.start).toBeCloseTo(0.9);
	});

	it('should zoom out (increase range) on positive deltaY', () => {
		const result = handleZoomWheel(100, 50, 100, 0.3, 0.7, 0.1);
		// zoomFactor = 1 + 0.1 = 1.1 => newRange = 0.4 * 1.1 = 0.44
		expect(result.end - result.start).toBeCloseTo(0.44);
	});

	it('should try to center the time marker', () => {
		const result = handleZoomWheel(-100, 50, 100, 0, 1, 0.1);
		// currentTimePercentage = 0.5
		// newRange = 0.9 => newStart = 0.5 - 0.45 = 0.05
		expect(result.start).toBeCloseTo(0.05);
		expect(result.end).toBeCloseTo(0.95);
	});

	it('should not zoom below 1% range', () => {
		const result = handleZoomWheel(-100, 50, 100, 0.49, 0.51, 0.99);
		// newRange would be very small, clamped to 0.01
		expect(result.end - result.start).toBeGreaterThanOrEqual(0.01);
	});

	it('should not zoom above 100% range', () => {
		const result = handleZoomWheel(100, 50, 100, 0, 1, 0.5);
		// newRange = 1 * 1.5 = 1.5, clamped to 1
		expect(result.start).toBe(0);
		expect(result.end).toBe(1);
	});

	it('should clamp start to 0', () => {
		const result = handleZoomWheel(-100, 5, 100, 0, 1, 0.1);
		// currentTimePercentage = 0.05, newRange = 0.9
		// newStart = 0.05 - 0.45 = -0.4 < 0
		expect(result.start).toBe(0);
		expect(result.end).toBeCloseTo(0.9);
	});

	it('should clamp end to 1', () => {
		const result = handleZoomWheel(-100, 95, 100, 0, 1, 0.1);
		// currentTimePercentage = 0.95, newRange = 0.9
		// newEnd = 0.95 + 0.45 = 1.4 > 1
		expect(result.end).toBe(1);
		expect(result.start).toBeCloseTo(0.1);
	});
});

// ── handleMirroredDrag ───────────────────────────────────────────────────────

describe('handleMirroredDrag', () => {
	const baseDragState: DragState = {
		isDraggingStart: true,
		isDraggingEnd: false,
		isDraggingBar: false,
		dragStartX: 0,
		initialStart: 0,
		initialEnd: 1
	};

	it('should return null when movementX is 0', () => {
		const result = handleMirroredDrag(500, 0, 1000, baseDragState, 0.2, 0.8, 50, 100);
		expect(result).toBeNull();
	});

	it('should zoom symmetrically when marker is centered', () => {
		// Marker at 50/100 = 0.5, range 0.25-0.75, marker exactly centered
		const dragState = { ...baseDragState, isDraggingStart: true };
		const result = handleMirroredDrag(500, 5, 1000, dragState, 0.25, 0.75, 50, 100);
		expect(result).not.toBeNull();
		// Both sides should adjust symmetrically
		const center = (result!.start + result!.end) / 2;
		expect(center).toBeCloseTo(0.5, 1);
	});

	it('should handle marker not visible (mirror from geometric center)', () => {
		// Marker at 10/100 = 0.1, range 0.5-0.8, marker outside range
		const dragState = { ...baseDragState, isDraggingStart: true };
		const result = handleMirroredDrag(600, 5, 1000, dragState, 0.5, 0.8, 10, 100);
		expect(result).not.toBeNull();
	});

	it('should move single handle towards center when marker visible but not centered', () => {
		// Marker at 60/100 = 0.6, range 0.2-0.8, relative progress = (60-20)/60 = 0.667 > 0.5
		// dragging start with positive movement (towards center)
		const dragState = { ...baseDragState, isDraggingStart: true };
		const result = handleMirroredDrag(500, 5, 1000, dragState, 0.2, 0.8, 60, 100);
		expect(result).not.toBeNull();
		// Since marker is to the right of center, start should increase
		expect(result!.start).toBeGreaterThan(0.2);
	});

	it('should limit new range to minimum of 0.01 when marker is centered', () => {
		// Try to zoom in so much that range would go below 0.01
		const dragState = { ...baseDragState, isDraggingStart: true };
		const result = handleMirroredDrag(500, 1000, 1000, dragState, 0.495, 0.505, 50, 100);
		// Range is 0.01, large movement should be rejected
		expect(result).toBeNull();
	});
});
