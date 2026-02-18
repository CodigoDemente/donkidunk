import { describe, expect, it, vi } from 'vitest';
import {
	handleTimeChange,
	handleRangeChange,
	handleDraggingTimeMarker
} from '../handlers/timeHandlers';

describe('handleTimeChange', () => {
	it('should call setCurrentTime with the given time', () => {
		const setCurrentTime = vi.fn();
		handleTimeChange(setCurrentTime, 42);
		expect(setCurrentTime).toHaveBeenCalledWith(42);
	});

	it('should call setCurrentTime with 0', () => {
		const setCurrentTime = vi.fn();
		handleTimeChange(setCurrentTime, 0);
		expect(setCurrentTime).toHaveBeenCalledWith(0);
	});
});

describe('handleRangeChange', () => {
	it('should call both setters with the given values', () => {
		const setStart = vi.fn();
		const setEnd = vi.fn();
		handleRangeChange(setStart, setEnd, 0.2, 0.8);
		expect(setStart).toHaveBeenCalledWith(0.2);
		expect(setEnd).toHaveBeenCalledWith(0.8);
	});
});

describe('handleDraggingTimeMarker', () => {
	it('should call setIsDragging with true', () => {
		const setIsDragging = vi.fn();
		handleDraggingTimeMarker(setIsDragging, true);
		expect(setIsDragging).toHaveBeenCalledWith(true);
	});

	it('should call setIsDragging with false', () => {
		const setIsDragging = vi.fn();
		handleDraggingTimeMarker(setIsDragging, false);
		expect(setIsDragging).toHaveBeenCalledWith(false);
	});
});
