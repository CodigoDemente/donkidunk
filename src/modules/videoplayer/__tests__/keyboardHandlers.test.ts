import { describe, expect, it } from 'vitest';
import { isDeleteKey } from '../handlers/keyboardHandlers';

describe('isDeleteKey', () => {
	it('should return true for "Delete"', () => {
		expect(isDeleteKey('Delete')).toBe(true);
	});

	it('should return true for "Backspace"', () => {
		expect(isDeleteKey('Backspace')).toBe(true);
	});

	it('should return false for other keys', () => {
		expect(isDeleteKey('Enter')).toBe(false);
		expect(isDeleteKey('Escape')).toBe(false);
		expect(isDeleteKey('a')).toBe(false);
		expect(isDeleteKey('Space')).toBe(false);
		expect(isDeleteKey('')).toBe(false);
	});

	it('should be case-sensitive', () => {
		expect(isDeleteKey('delete')).toBe(false);
		expect(isDeleteKey('backspace')).toBe(false);
		expect(isDeleteKey('DELETE')).toBe(false);
	});
});
