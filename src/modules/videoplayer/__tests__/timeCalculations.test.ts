import { describe, expect, it } from 'vitest';
import {
	mapClickToVisibleTime,
	clampTime,
	calculateTimeFromPosition
} from '../utils/timeCalculations';

describe('mapClickToVisibleTime', () => {
	it('should return leftLimitTime when clickX is 0', () => {
		expect(mapClickToVisibleTime(0, 800, 10, 30)).toBe(10);
	});

	it('should return rightLimitTime when clickX equals buttonWidth', () => {
		expect(mapClickToVisibleTime(800, 800, 10, 30)).toBe(40);
	});

	it('should return midpoint when clickX is half the buttonWidth', () => {
		expect(mapClickToVisibleTime(400, 800, 10, 30)).toBe(25);
	});

	it('should handle zero leftLimitTime', () => {
		expect(mapClickToVisibleTime(200, 1000, 0, 100)).toBe(20);
	});

	it('should handle fractional positions', () => {
		const result = mapClickToVisibleTime(250, 1000, 5, 60);
		expect(result).toBeCloseTo(20, 5);
	});
});

describe('clampTime', () => {
	it('should return the value when within range', () => {
		expect(clampTime(5, 0.1, 10)).toBe(5);
	});

	it('should clamp to min when value is below min', () => {
		expect(clampTime(-1, 0.1, 10)).toBe(0.1);
	});

	it('should clamp to max when value is above max', () => {
		expect(clampTime(15, 0.1, 10)).toBe(10);
	});

	it('should use default min of 0.1', () => {
		expect(clampTime(0, undefined, 10)).toBe(0.1);
	});

	it('should return min when value equals min', () => {
		expect(clampTime(0.1, 0.1, 10)).toBe(0.1);
	});

	it('should return max when value equals max', () => {
		expect(clampTime(10, 0.1, 10)).toBe(10);
	});
});

describe('calculateTimeFromPosition', () => {
	const mockRect = { left: 100, width: 800 } as DOMRect;

	it('should calculate correct time for a click in the middle', () => {
		// clientX=500 => x=400 => half of 800 => 50% of visible range
		const result = calculateTimeFromPosition(500, mockRect, 10, 30, 60);
		// mapClickToVisibleTime(400, 800, 10, 30) = 10 + 0.5*30 = 25
		// clampTime(25, 0.1, 60) = 25
		expect(result).toBe(25);
	});

	it('should return -1 when click is before the progress bar', () => {
		expect(calculateTimeFromPosition(50, mockRect, 0, 60, 60)).toBe(-1);
	});

	it('should return -1 when click is after the progress bar', () => {
		expect(calculateTimeFromPosition(950, mockRect, 0, 60, 60)).toBe(-1);
	});

	it('should clamp time to 0.1 minimum', () => {
		// Click at x=0 (left edge) with leftLimitTime=0
		const result = calculateTimeFromPosition(100, mockRect, 0, 60, 60);
		// mapClickToVisibleTime(0, 800, 0, 60) = 0
		// clampTime(0, 0.1, 60) = 0.1
		expect(result).toBe(0.1);
	});

	it('should clamp time to duration maximum', () => {
		// Click at the right edge, visible range goes beyond duration
		const result = calculateTimeFromPosition(900, mockRect, 50, 100, 60);
		// mapClickToVisibleTime(800, 800, 50, 100) = 50+100 = 150
		// clampTime(150, 0.1, 60) = 60
		expect(result).toBe(60);
	});

	it('should handle click at left edge (x=0)', () => {
		const result = calculateTimeFromPosition(100, mockRect, 20, 40, 100);
		// x=0 => mapClickToVisibleTime(0, 800, 20, 40) = 20
		// clampTime(20, 0.1, 100) = 20
		expect(result).toBe(20);
	});

	it('should handle click at right edge (x=width)', () => {
		const result = calculateTimeFromPosition(900, mockRect, 20, 40, 100);
		// x=800 => mapClickToVisibleTime(800, 800, 20, 40) = 20+40 = 60
		// clampTime(60, 0.1, 100) = 60
		expect(result).toBe(60);
	});
});
