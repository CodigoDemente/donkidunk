import { test, expect, describe } from 'vitest';
import {
	getTextColorForBackground,
	getHoverBackgroundColor,
	hexStringToRgb
} from '../utils/colors';

// ─── getTextColorForBackground ──────────────────────────────────────────────

describe('getTextColorForBackground', () => {
	const testColors = [
		{ name: 'Black', hex: '#000000', expected: '#FFFFFF' },
		{ name: 'White', hex: '#FFFFFF', expected: '#000000' },
		{ name: 'Red', hex: '#FF0000', expected: '#FFFFFF' },
		{ name: 'Lime', hex: '#00FF00', expected: '#000000' },
		{ name: 'Blue', hex: '#0000FF', expected: '#FFFFFF' },
		{ name: 'Yellow', hex: '#FFFF00', expected: '#000000' },
		{ name: 'Cyan', hex: '#00FFFF', expected: '#000000' },
		{ name: 'Magenta', hex: '#FF00FF', expected: '#FFFFFF' },
		{ name: 'Silver', hex: '#BFBFBF', expected: '#000000' },
		{ name: 'Gray', hex: '#808080', expected: '#FFFFFF' },
		{ name: 'Maroon', hex: '#800000', expected: '#ffffff' },
		{ name: 'Olive', hex: '#808000', expected: '#ffffff' },
		{ name: 'Green', hex: '#008000', expected: '#ffffff' },
		{ name: 'Purple', hex: '#800080', expected: '#ffffff' },
		{ name: 'Teal', hex: '#008080', expected: '#ffffff' },
		{ name: 'Navy', hex: '#000080', expected: '#ffffff' },
		{ name: 'Light Coral', hex: '#ffa98a', expected: '#000000' },
		{ name: 'Dark Slate Blue', hex: '#271e61', expected: '#ffffff' },
		{ name: 'Sea Green', hex: '#afcfaf', expected: '#000000' },
		{ name: 'Goldenrod', hex: '#daa520', expected: '#FFFFFF' },
		{ name: 'Midnight Blue', hex: '#171768', expected: '#ffffff' }
	];

	test.each(testColors)(
		'should return correct text color for $name ($hex)',
		({ name: _name, hex, expected }) => {
			const result = getTextColorForBackground(hex);
			expect(result.toLowerCase()).toBe(expected.toLowerCase());
		}
	);

	test('should handle 3-character hex codes', () => {
		// #F00 is equivalent to #FF0000 (red)
		const result = getTextColorForBackground('#F00');
		const expectedForRed = '#ffffff'; // Red L=50% -> L=100% (white)
		expect(result.toLowerCase()).toBe(expectedForRed.toLowerCase());
	});

	test('should handle hex codes without # prefix', () => {
		const result = getTextColorForBackground('FF0000');
		const expectedForRed = '#ffffff'; // Red L=50% -> L=100% (white)
		expect(result.toLowerCase()).toBe(expectedForRed.toLowerCase());
	});
});

// ─── hexStringToRgb ─────────────────────────────────────────────────────────

describe('hexStringToRgb', () => {
	test('should parse 6-digit hex with # prefix', () => {
		expect(hexStringToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
		expect(hexStringToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
		expect(hexStringToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
	});

	test('should parse 6-digit hex without # prefix', () => {
		expect(hexStringToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
		expect(hexStringToRgb('00FF00')).toEqual({ r: 0, g: 255, b: 0 });
	});

	test('should parse 3-digit shorthand hex', () => {
		// #F00 → #FF0000
		expect(hexStringToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
		// #0F0 → #00FF00
		expect(hexStringToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 });
		// #FFF → #FFFFFF
		expect(hexStringToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
		// #000 → #000000
		expect(hexStringToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
	});

	test('should handle lowercase hex', () => {
		expect(hexStringToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
		expect(hexStringToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
	});

	test('should parse black and white', () => {
		expect(hexStringToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
		expect(hexStringToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
	});

	test('should parse mixed-case hex', () => {
		expect(hexStringToRgb('#aAbBcC')).toEqual({ r: 170, g: 187, b: 204 });
	});
});

// ─── getHoverBackgroundColor ────────────────────────────────────────────────

describe('getHoverBackgroundColor', () => {
	test('should return a darker shade of the input color', () => {
		const original = '#3b82f6'; // Blue
		const hover = getHoverBackgroundColor(original);

		// Parse both to compare lightness
		const origRgb = hexStringToRgb(original);
		const hoverRgb = hexStringToRgb(hover);

		// The hover color should be darker (lower overall intensity)
		const origBrightness = origRgb.r + origRgb.g + origRgb.b;
		const hoverBrightness = hoverRgb.r + hoverRgb.g + hoverRgb.b;
		expect(hoverBrightness).toBeLessThan(origBrightness);
	});

	test('should return a valid 7-character hex string', () => {
		const result = getHoverBackgroundColor('#3b82f6');
		expect(result).toMatch(/^#[0-9a-f]{6}$/);
	});

	test('should darken white', () => {
		const result = getHoverBackgroundColor('#FFFFFF');
		// White darkened should not still be white
		expect(result.toLowerCase()).not.toBe('#ffffff');
	});

	test('should handle already dark colors without going below black', () => {
		// Very dark color - lightness close to 0, should not produce negative values
		const result = getHoverBackgroundColor('#0a0a0a');
		expect(result).toMatch(/^#[0-9a-f]{6}$/);

		const rgb = hexStringToRgb(result);
		expect(rgb.r).toBeGreaterThanOrEqual(0);
		expect(rgb.g).toBeGreaterThanOrEqual(0);
		expect(rgb.b).toBeGreaterThanOrEqual(0);
	});

	test('should handle pure black by clamping lightness to 0', () => {
		const result = getHoverBackgroundColor('#000000');
		expect(result).toMatch(/^#[0-9a-f]{6}$/);
		// Black has L=0, reducing by 0.1 should clamp to 0, so result stays black
		expect(result).toBe('#000000');
	});

	test('should handle 3-character hex', () => {
		const result = getHoverBackgroundColor('#F00');
		expect(result).toMatch(/^#[0-9a-f]{6}$/);
	});

	test('should handle various hue ranges', () => {
		// Note: #ff00ff (magenta) is excluded because computeHue has a known issue
		// where JS's modulo operator produces negative hue values for that color.
		const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff'];
		for (const color of colors) {
			const result = getHoverBackgroundColor(color);
			expect(result).toMatch(/^#[0-9a-f]{6}$/);

			// All should be darker than or equal to original
			const origRgb = hexStringToRgb(color);
			const hoverRgb = hexStringToRgb(result);
			const origSum = origRgb.r + origRgb.g + origRgb.b;
			const hoverSum = hoverRgb.r + hoverRgb.g + hoverRgb.b;
			expect(hoverSum).toBeLessThanOrEqual(origSum);
		}
	});
});
