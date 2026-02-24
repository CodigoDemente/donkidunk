import { describe, expect, it, vi } from 'vitest';
import { onTimelineWheel } from '../handlers/interactionHandlers';

function createMockWheelEvent(overrides: Partial<WheelEvent> = {}): WheelEvent {
	return {
		ctrlKey: false,
		deltaY: 0,
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
		...overrides
	} as unknown as WheelEvent;
}

describe('onTimelineWheel', () => {
	it('should do nothing when ctrlKey is not pressed', () => {
		const setStart = vi.fn();
		const setEnd = vi.fn();
		const event = createMockWheelEvent({ ctrlKey: false, deltaY: -100 });

		onTimelineWheel(event, 50, 100, 0, 1, setStart, setEnd);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(setStart).not.toHaveBeenCalled();
		expect(setEnd).not.toHaveBeenCalled();
	});

	it('should prevent default and stop propagation when ctrlKey is pressed', () => {
		const setStart = vi.fn();
		const setEnd = vi.fn();
		const event = createMockWheelEvent({ ctrlKey: true, deltaY: -100 });

		onTimelineWheel(event, 50, 100, 0, 1, setStart, setEnd);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(event.stopPropagation).toHaveBeenCalled();
	});

	it('should call setters with zoom result when ctrlKey is pressed', () => {
		const setStart = vi.fn();
		const setEnd = vi.fn();
		const event = createMockWheelEvent({ ctrlKey: true, deltaY: -100 });

		onTimelineWheel(event, 50, 100, 0, 1, setStart, setEnd);

		expect(setStart).toHaveBeenCalledOnce();
		expect(setEnd).toHaveBeenCalledOnce();
		// Zoom in should reduce the range
		const newStart = setStart.mock.calls[0][0];
		const newEnd = setEnd.mock.calls[0][0];
		expect(newEnd - newStart).toBeLessThan(1);
	});

	it('should zoom out when deltaY is positive', () => {
		const setStart = vi.fn();
		const setEnd = vi.fn();
		const event = createMockWheelEvent({ ctrlKey: true, deltaY: 100 });

		onTimelineWheel(event, 50, 100, 0.3, 0.7, setStart, setEnd);

		const newStart = setStart.mock.calls[0][0];
		const newEnd = setEnd.mock.calls[0][0];
		// Zoom out should increase the range
		expect(newEnd - newStart).toBeGreaterThan(0.4);
	});
});
