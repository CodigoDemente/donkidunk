import { describe, expect, it } from 'vitest';
import { applyCenterTime } from '../logic/autoScroll';

describe('applyCenterTime', () => {
	it('should return null when isAutoScrolling is true', () => {
		const result = applyCenterTime(50, 100, 0, 0.5, true);
		expect(result).toBeNull();
	});

	it('should return centered range when not auto-scrolling', () => {
		const result = applyCenterTime(50, 100, 0, 0.5, false);
		expect(result).not.toBeNull();
		// Should call centerTimeInRange(50, 100, 0, 0.5)
		// timePercentage=0.5, rangeWidth=0.5
		// newStart=0.5-0.05=0.45, newEnd=0.5+0.45=0.95
		expect(result!.start).toBeCloseTo(0.45);
		expect(result!.end).toBeCloseTo(0.95);
	});

	it('should clamp start to 0 when centering near the beginning', () => {
		const result = applyCenterTime(2, 100, 0.3, 0.7, false);
		// timePercentage=0.02, rangeWidth=0.4
		// newStart=0.02-0.04=-0.02 < 0 → clamped to 0, newEnd=rangeWidth=0.4
		// Using toBeCloseTo because floating point arithmetic (e.g. 0+0.4)
		// can produce values like 0.39999999999999997 instead of exact 0.4.
		expect(result!.start).toBe(0);
		expect(result!.end).toBeCloseTo(0.4);
	});

	it('should clamp end to 1 when centering near the end', () => {
		const result = applyCenterTime(98, 100, 0.3, 0.7, false);
		// timePercentage=0.98, rangeWidth=0.4
		// newEnd=0.98+0.36=1.34 > 1 → clamped to 1, newStart=1-0.4=0.6
		// Using toBeCloseTo because 1-0.4 gives 0.6000000000000001 in JS
		// due to IEEE 754 double precision float representation.
		expect(result!.end).toBe(1);
		expect(result!.start).toBeCloseTo(0.6);
	});

	it('should preserve range width', () => {
		const result = applyCenterTime(50, 100, 0.2, 0.5, false);
		expect(result).not.toBeNull();
		expect(result!.end - result!.start).toBeCloseTo(0.3);
	});
});
