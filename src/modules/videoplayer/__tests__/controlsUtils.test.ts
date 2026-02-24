import { describe, expect, it } from 'vitest';
import { speedOptions, skipStepOptions } from '../utils/controlsUtils';

describe('speedOptions', () => {
	it('should contain 5 speed options', () => {
		expect(speedOptions).toHaveLength(5);
	});

	it('should have values in ascending order', () => {
		const values = speedOptions.map((o) => o.value);
		for (let i = 1; i < values.length; i++) {
			expect(values[i]).toBeGreaterThan(values[i - 1]);
		}
	});

	it('should include normal speed (1.0)', () => {
		expect(speedOptions.find((o) => o.value === 1.0)).toBeDefined();
	});

	it('should have matching label format "xN.N"', () => {
		for (const option of speedOptions) {
			expect(option.label).toMatch(/^x\d+\.\d+$/);
		}
	});
});

describe('skipStepOptions', () => {
	it('should contain 6 skip step options', () => {
		expect(skipStepOptions).toHaveLength(6);
	});

	it('should have values in ascending order', () => {
		const values = skipStepOptions.map((o) => o.value);
		for (let i = 1; i < values.length; i++) {
			expect(values[i]).toBeGreaterThan(values[i - 1]);
		}
	});

	it('should have all positive integer values', () => {
		for (const option of skipStepOptions) {
			expect(option.value).toBeGreaterThan(0);
			expect(Number.isInteger(option.value)).toBe(true);
		}
	});
});
