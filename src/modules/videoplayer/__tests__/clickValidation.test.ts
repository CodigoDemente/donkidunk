import { describe, expect, it, vi } from 'vitest';
import { shouldIgnoreClick } from '../utils/clickValidation';

/**
 * Mock HTMLElement-like objects for Node.js testing.
 * We use plain objects that satisfy the property/method signatures
 * used by shouldIgnoreClick.
 */
function createMockElement(overrides: Record<string, unknown> = {}): HTMLElement {
	return {
		id: '',
		closest: vi.fn().mockReturnValue(null),
		...overrides
	} as unknown as HTMLElement;
}

describe('shouldIgnoreClick', () => {
	it('should return true when isDraggingTimeMarker is true', () => {
		const target = createMockElement();
		expect(shouldIgnoreClick(target, null, true)).toBe(true);
	});

	it('should return true when target has id "time-marker"', () => {
		const target = createMockElement({ id: 'time-marker' });
		expect(shouldIgnoreClick(target, null, false)).toBe(true);
	});

	it('should return true when target is inside #time-marker', () => {
		const timeMarkerEl = createMockElement({ id: 'time-marker' });
		const target = createMockElement({
			id: '',
			closest: vi.fn((selector: string) => {
				if (selector === '#time-marker') return timeMarkerEl;
				return null;
			})
		});
		expect(shouldIgnoreClick(target, null, false)).toBe(true);
	});

	it('should return true when target is inside a role="button" that is not the progress bar', () => {
		const otherButton = createMockElement();
		const target = createMockElement({
			closest: vi.fn((selector: string) => {
				if (selector === '#time-marker') return null;
				if (selector === '[role="button"]') return otherButton;
				return null;
			})
		});
		expect(shouldIgnoreClick(target, null, false)).toBe(true);
	});

	it('should return false when target is inside a role="button" that IS the progress bar', () => {
		const progressBar = createMockElement();
		const target = createMockElement({
			closest: vi.fn((selector: string) => {
				if (selector === '#time-marker') return null;
				if (selector === '[role="button"]') return progressBar;
				return null;
			})
		});
		expect(shouldIgnoreClick(target, progressBar, false)).toBe(false);
	});

	it('should return false for a regular click on the progress bar area', () => {
		const target = createMockElement();
		const progressBar = createMockElement();
		expect(shouldIgnoreClick(target, progressBar, false)).toBe(false);
	});
});
