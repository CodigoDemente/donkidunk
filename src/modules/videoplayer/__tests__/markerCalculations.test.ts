import { describe, expect, it } from 'vitest';
import {
	getTimeInterval,
	generateMarkerPositions,
	getMarkerPercentage
} from '../utils/markerCalculations';

// ── getTimeInterval ──────────────────────────────────────────────────────────

describe('getTimeInterval', () => {
	it('should return 15m interval for > 60 minutes visible', () => {
		const result = getTimeInterval(61 * 60);
		expect(result).toEqual({ seconds: 15 * 60, label: '15m' });
	});

	it('should return 10m interval for 30-60 minutes visible', () => {
		const result = getTimeInterval(45 * 60);
		expect(result).toEqual({ seconds: 10 * 60, label: '10m' });
	});

	it('should return 5m interval for 15-30 minutes visible', () => {
		const result = getTimeInterval(20 * 60);
		expect(result).toEqual({ seconds: 5 * 60, label: '5m' });
	});

	it('should return 1m interval for 5-15 minutes visible', () => {
		const result = getTimeInterval(10 * 60);
		expect(result).toEqual({ seconds: 60, label: '1m' });
	});

	it('should return 30s interval for 2-5 minutes visible', () => {
		const result = getTimeInterval(3 * 60);
		expect(result).toEqual({ seconds: 30, label: '30s' });
	});

	it('should return 15s interval for 1-2 minutes visible', () => {
		const result = getTimeInterval(90);
		expect(result).toEqual({ seconds: 15, label: '15s' });
	});

	it('should return 10s interval for < 1 minute visible', () => {
		const result = getTimeInterval(45);
		expect(result).toEqual({ seconds: 10, label: '10s' });
	});

	it('should return 10s at boundary of exactly 1 minute', () => {
		const result = getTimeInterval(60);
		expect(result).toEqual({ seconds: 10, label: '10s' });
	});

	it('should return 15s at boundary of exactly 2 minutes', () => {
		const result = getTimeInterval(120);
		expect(result).toEqual({ seconds: 15, label: '15s' });
	});

	it('should return 30s at boundary of exactly 5 minutes', () => {
		const result = getTimeInterval(5 * 60);
		expect(result).toEqual({ seconds: 30, label: '30s' });
	});
});

// ── generateMarkerPositions ──────────────────────────────────────────────────

describe('generateMarkerPositions', () => {
	it('should generate markers at regular intervals within visible range', () => {
		const positions = generateMarkerPositions(0, 60, 10);
		expect(positions).toEqual([0, 10, 20, 30, 40, 50, 60]);
	});

	it('should start from the first marker after leftLimitTime', () => {
		const positions = generateMarkerPositions(5, 60, 10);
		expect(positions).toEqual([10, 20, 30, 40, 50, 60]);
	});

	it('should include rightLimitTime if it falls on an interval', () => {
		const positions = generateMarkerPositions(0, 30, 10);
		expect(positions).toEqual([0, 10, 20, 30]);
	});

	it('should return empty array when range is smaller than interval', () => {
		const positions = generateMarkerPositions(12, 18, 30);
		expect(positions).toEqual([]);
	});

	it('should handle a single marker in range', () => {
		const positions = generateMarkerPositions(25, 35, 30);
		expect(positions).toEqual([30]);
	});

	it('should handle fractional leftLimitTime correctly', () => {
		const positions = generateMarkerPositions(0.5, 30, 10);
		expect(positions).toEqual([10, 20, 30]);
	});

	it('should handle zero-width range', () => {
		const positions = generateMarkerPositions(10, 10, 10);
		expect(positions).toEqual([10]);
	});
});

// ── getMarkerPercentage ──────────────────────────────────────────────────────

describe('getMarkerPercentage', () => {
	it('should return 0 for a marker at the left limit', () => {
		expect(getMarkerPercentage(10, 10, 50)).toBe(0);
	});

	it('should return 100 for a marker at the right limit', () => {
		expect(getMarkerPercentage(60, 10, 50)).toBe(100);
	});

	it('should return 50 for a marker in the middle', () => {
		expect(getMarkerPercentage(35, 10, 50)).toBe(50);
	});

	it('should return 25 for a marker at one quarter', () => {
		expect(getMarkerPercentage(22.5, 10, 50)).toBe(25);
	});

	it('should handle fractional percentages', () => {
		expect(getMarkerPercentage(11, 10, 50)).toBeCloseTo(2);
	});
});
