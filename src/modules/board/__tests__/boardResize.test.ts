import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.mock is hoisted, so the mock function must also be hoisted
const { mockSaveBoardSizeCommand } = vi.hoisted(() => ({
	mockSaveBoardSizeCommand: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../config/commands/SaveBoardSize', () => ({
	saveBoardSizeCommand: mockSaveBoardSizeCommand
}));

import { startResize } from '../handlers/boardResize';

// ─── DOM helpers ────────────────────────────────────────────────────────────

function createMockContainer(rect: Partial<DOMRect> = {}): HTMLElement {
	const defaultRect = {
		left: 0,
		top: 0,
		width: 800,
		height: 600,
		right: 800,
		bottom: 600,
		x: 0,
		y: 0,
		toJSON: () => ({})
	};

	const boxes: HTMLElement[] = [];
	return {
		getBoundingClientRect: vi.fn().mockReturnValue({ ...defaultRect, ...rect }),
		querySelectorAll: vi.fn().mockReturnValue(boxes),
		id: 'boards-container'
	} as unknown as HTMLElement;
}

function createMockConfig() {
	return {
		boardSize: { events: 50, tags: 50 }
	} as any;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('startResize', () => {
	let eventListeners: Map<string, Function[]>;
	let mockDocument: Record<string, any>;

	beforeEach(() => {
		eventListeners = new Map();

		mockDocument = {
			getElementById: vi.fn().mockReturnValue(null),
			addEventListener: vi.fn((event: string, handler: Function) => {
				if (!eventListeners.has(event)) {
					eventListeners.set(event, []);
				}
				eventListeners.get(event)!.push(handler);
			}),
			removeEventListener: vi.fn((event: string, handler: Function) => {
				const listeners = eventListeners.get(event);
				if (listeners) {
					const idx = listeners.indexOf(handler);
					if (idx >= 0) listeners.splice(idx, 1);
				}
			})
		};

		vi.stubGlobal('document', mockDocument);
		mockSaveBoardSizeCommand.mockClear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test('should register mousemove and mouseup event listeners', () => {
		const container = createMockContainer();
		mockDocument.getElementById = vi.fn().mockReturnValue(container);

		const setFirst = vi.fn();
		const setSecond = vi.fn();
		const config = createMockConfig();

		startResize(setFirst, setSecond, config);

		expect(mockDocument.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
		expect(mockDocument.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));

		const mouseupListeners = eventListeners.get('mouseup');
		expect(mouseupListeners?.length).toBe(2); // stopResize + saveBoardSize
	});

	test('should calculate correct percentages on mousemove', () => {
		const container = createMockContainer({ top: 0, height: 1000 });
		mockDocument.getElementById = vi.fn().mockReturnValue(container);

		const setFirst = vi.fn();
		const setSecond = vi.fn();
		const config = createMockConfig();

		startResize(setFirst, setSecond, config);

		// Simulate mouse move to the middle
		const mouseMoveHandler = eventListeners.get('mousemove')![0];
		mouseMoveHandler({ clientY: 500 } as MouseEvent);

		// 500 / 1000 * 100 = 50%
		expect(setFirst).toHaveBeenCalledWith(50);
		expect(setSecond).toHaveBeenCalledWith(50);
	});

	test('should clamp percentages between 10 and 90', () => {
		const container = createMockContainer({ top: 0, height: 1000 });
		mockDocument.getElementById = vi.fn().mockReturnValue(container);

		const setFirst = vi.fn();
		const setSecond = vi.fn();
		const config = createMockConfig();

		startResize(setFirst, setSecond, config);
		const mouseMoveHandler = eventListeners.get('mousemove')![0];

		// Move to very top (should clamp to 10%)
		mouseMoveHandler({ clientY: 50 } as MouseEvent);
		expect(setFirst).toHaveBeenCalledWith(10);
		expect(setSecond).toHaveBeenCalledWith(90);

		setFirst.mockClear();
		setSecond.mockClear();

		// Move to very bottom (should clamp to 90%)
		mouseMoveHandler({ clientY: 950 } as MouseEvent);
		expect(setFirst).toHaveBeenCalledWith(90);
		expect(setSecond).toHaveBeenCalledWith(10);
	});

	test('should remove event listeners on mouseup (stopResize)', () => {
		const container = createMockContainer();
		mockDocument.getElementById = vi.fn().mockReturnValue(container);

		const setFirst = vi.fn();
		const setSecond = vi.fn();
		const config = createMockConfig();

		startResize(setFirst, setSecond, config);

		// Trigger the stopResize handler (first mouseup listener)
		const mouseupListeners = eventListeners.get('mouseup')!;
		const stopResize = mouseupListeners[0];
		stopResize();

		expect(mockDocument.removeEventListener).toHaveBeenCalledWith(
			'mousemove',
			expect.any(Function)
		);
		expect(mockDocument.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
	});

	test('should call saveBoardSizeCommand on mouseup', async () => {
		const container = createMockContainer({ top: 0, height: 1000 });
		mockDocument.getElementById = vi.fn().mockReturnValue(container);

		const setFirst = vi.fn();
		const setSecond = vi.fn();
		const config = createMockConfig();

		startResize(setFirst, setSecond, config);

		// Simulate moving to 60%
		const mouseMoveHandler = eventListeners.get('mousemove')![0];
		mouseMoveHandler({ clientY: 600 } as MouseEvent);

		// Trigger saveBoardSize handler (second mouseup listener)
		const mouseupListeners = eventListeners.get('mouseup')!;
		const saveBoardSize = mouseupListeners[1];
		await saveBoardSize();

		expect(mockSaveBoardSizeCommand).toHaveBeenCalledWith(60, 40);
		expect(config.boardSize).toEqual({ events: 60, tags: 40 });
	});

	test('should not update sizes when container is not found during mousemove', () => {
		// Initial call finds the container (for the transition disable)
		const container = createMockContainer();
		mockDocument.getElementById = vi.fn().mockReturnValue(container);

		const setFirst = vi.fn();
		const setSecond = vi.fn();
		const config = createMockConfig();

		startResize(setFirst, setSecond, config);

		// Now container returns null for subsequent getElementById calls
		mockDocument.getElementById = vi.fn().mockReturnValue(null);

		const mouseMoveHandler = eventListeners.get('mousemove')![0];
		mouseMoveHandler({ clientY: 500 } as MouseEvent);

		expect(setFirst).not.toHaveBeenCalled();
		expect(setSecond).not.toHaveBeenCalled();
	});
});
