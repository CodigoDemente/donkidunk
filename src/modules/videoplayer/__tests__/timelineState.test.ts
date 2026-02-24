import { describe, expect, it } from 'vitest';
import { computeTimelineLimits, computeRelativeProgress } from '../logic/timelineState';

describe('computeTimelineLimits', () => {
	it('should delegate to calculateTimelineLimits and return correct limits', () => {
		const result = computeTimelineLimits(120, 0, 1);
		expect(result.leftLimitTime).toBe(0);
		expect(result.rightLimitTime).toBe(120);
		expect(result.visibleDuration).toBe(120);
	});

	it('should handle zoomed-in range', () => {
		const result = computeTimelineLimits(100, 0.2, 0.6);
		expect(result.leftLimitTime).toBe(20);
		expect(result.rightLimitTime).toBe(60);
		expect(result.visibleDuration).toBe(40);
	});
});

describe('computeRelativeProgress', () => {
	it('should delegate to calculateRelativeProgress', () => {
		expect(computeRelativeProgress(15, 10, 20, 10)).toBe(0.5);
	});

	it('should return 0 at left limit', () => {
		expect(computeRelativeProgress(10, 10, 20, 10)).toBe(0);
	});

	it('should return 1 at right limit', () => {
		expect(computeRelativeProgress(20, 10, 20, 10)).toBe(1);
	});
});
