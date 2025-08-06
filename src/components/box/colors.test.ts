import { test, expect, describe } from 'vitest';
import { getTextColorForBackground } from './colors';

describe('getTextColorForBackground', () => {
	const testColors = [
		{ name: 'Black', hex: '#000000', expected: '#bfbfbf' },
		{ name: 'White', hex: '#FFFFFF', expected: '#404040' },
		{ name: 'Red', hex: '#FF0000', expected: '#000000' },
		{ name: 'Lime', hex: '#00FF00', expected: '#000000' },
		{ name: 'Blue', hex: '#0000FF', expected: '#000000' },
		{ name: 'Yellow', hex: '#FFFF00', expected: '#000000' },
		{ name: 'Cyan', hex: '#00FFFF', expected: '#000000' },
		{ name: 'Magenta', hex: '#FF00FF', expected: '#000000' },
		{ name: 'Silver', hex: '#BFBFBF', expected: '#000000' },
		{ name: 'Gray', hex: '#808080', expected: '#000000' },
		{ name: 'Maroon', hex: '#800000', expected: '#ffffff' },
		{ name: 'Olive', hex: '#808000', expected: '#ffffff' },
		{ name: 'Green', hex: '#008000', expected: '#ffffff' },
		{ name: 'Purple', hex: '#800080', expected: '#ffffff' },
		{ name: 'Teal', hex: '#008080', expected: '#ffffff' },
		{ name: 'Navy', hex: '#000080', expected: '#ffffff' },
		{ name: 'Light Coral', hex: '#ffa98a', expected: '#7f2201' },
		{ name: 'Dark Slate Blue', hex: '#271e61', expected: '#a69de2' },
		{ name: 'Sea Green', hex: '#afcfaf', expected: '#000000' },
		{ name: 'Goldenrod', hex: '#daa520', expected: '#ffffff' },
		{ name: 'Midnight Blue', hex: '#171768', expected: '#9595e9' }
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
		const expectedForRed = '#000000'; // Red L=50% -> L=0% (black)
		expect(result.toLowerCase()).toBe(expectedForRed.toLowerCase());
	});

	test('should handle hex codes without # prefix', () => {
		const result = getTextColorForBackground('FF0000');
		const expectedForRed = '#000000'; // Red L=50% -> L=0% (black)
		expect(result.toLowerCase()).toBe(expectedForRed.toLowerCase());
	});
});
