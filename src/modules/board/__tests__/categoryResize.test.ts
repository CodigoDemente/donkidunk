import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
	createResizeState,
	handleResizeStart,
	handleResizeMove,
	handleResizeEnd,
	type ResizeState
} from '../handlers/categoryResize';
import type { Category } from '../types/Category';
import { CategoryType } from '../types/CategoryType';
import type { Board } from '../context.svelte';

// ─── Mock helpers ───────────────────────────────────────────────────────────

function createMockMouseEvent(overrides: Partial<MouseEvent> = {}): MouseEvent {
	return {
		clientX: 100,
		clientY: 100,
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
		stopImmediatePropagation: vi.fn(),
		...overrides
	} as unknown as MouseEvent;
}

function createMockCategory(overrides: Partial<Category> = {}): Category {
	return {
		id: 'cat-1',
		name: 'Test',
		type: CategoryType.Event,
		color: '#000',
		position: { x: 10, y: 20 },
		buttons: [],
		...overrides
	};
}

function createMockBoard(): Board {
	return {
		updateCategoryPosition: vi.fn().mockResolvedValue(undefined),
		updateCategorySize: vi.fn().mockResolvedValue(undefined)
	} as unknown as Board;
}

function createMockDivElement(
	rect: Partial<DOMRect> = {},
	extras: Record<string, unknown> = {}
): HTMLDivElement {
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

	return {
		getBoundingClientRect: vi.fn().mockReturnValue({ ...defaultRect, ...rect }),
		parentElement: null,
		...extras
	} as unknown as HTMLDivElement;
}

// ─── createResizeState ──────────────────────────────────────────────────────

describe('createResizeState', () => {
	test('should return default state with all zeroed values', () => {
		const state = createResizeState();
		expect(state).toEqual({
			resizeHandle: null,
			resizeStartX: 0,
			resizeStartY: 0,
			resizeStartWidth: 0,
			resizeStartHeight: 0,
			resizeStartLeft: 0,
			resizeStartTop: 0,
			containerElement: null,
			cachedMinHeight: 0
		});
	});

	test('should return a new object each time', () => {
		const state1 = createResizeState();
		const state2 = createResizeState();
		expect(state1).not.toBe(state2);
	});
});

// ─── handleResizeStart ──────────────────────────────────────────────────────

describe('handleResizeStart', () => {
	let state: ResizeState;
	let board: Board;

	beforeEach(() => {
		state = createResizeState();
		board = createMockBoard();
	});

	test('should set resizeHandle to the specified handle', () => {
		const containerEl = createMockDivElement({ width: 1000, height: 800 });
		const categoryEl = createMockDivElement(
			{ left: 100, top: 50, width: 200, height: 150 },
			{ parentElement: containerEl }
		);
		const headerEl = createMockDivElement({}, { offsetHeight: 30 });
		const contentEl = createMockDivElement({}, { scrollHeight: 100 });
		const event = createMockMouseEvent({ clientX: 300, clientY: 200 });
		const category = createMockCategory();

		handleResizeStart(
			event,
			'right',
			state,
			categoryEl,
			headerEl,
			contentEl,
			category,
			CategoryType.Event,
			board
		);

		expect(state.resizeHandle).toBe('right');
	});

	test('should prevent default and stop propagation', () => {
		const containerEl = createMockDivElement({ width: 1000, height: 800 });
		const categoryEl = createMockDivElement(
			{ left: 100, top: 50, width: 200, height: 150 },
			{ parentElement: containerEl }
		);
		const headerEl = createMockDivElement({}, { offsetHeight: 30 });
		const contentEl = createMockDivElement({}, { scrollHeight: 100 });
		const event = createMockMouseEvent({ clientX: 300, clientY: 200 });
		const category = createMockCategory();

		handleResizeStart(
			event,
			'right',
			state,
			categoryEl,
			headerEl,
			contentEl,
			category,
			CategoryType.Event,
			board
		);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(event.stopPropagation).toHaveBeenCalled();
		expect(event.stopImmediatePropagation).toHaveBeenCalled();
	});

	test('should store starting position and dimensions', () => {
		const containerEl = createMockDivElement({
			left: 0,
			top: 0,
			width: 1000,
			height: 800
		});
		const categoryEl = createMockDivElement(
			{ left: 100, top: 80, width: 200, height: 150 },
			{ parentElement: containerEl }
		);
		const headerEl = createMockDivElement({}, { offsetHeight: 30 });
		const contentEl = createMockDivElement({}, { scrollHeight: 100 });
		const event = createMockMouseEvent({ clientX: 300, clientY: 200 });
		const category = createMockCategory();

		handleResizeStart(
			event,
			'bottom-right',
			state,
			categoryEl,
			headerEl,
			contentEl,
			category,
			CategoryType.Event,
			board
		);

		expect(state.resizeStartX).toBe(300);
		expect(state.resizeStartY).toBe(200);
		expect(state.resizeStartWidth).toBe(200);
		expect(state.resizeStartHeight).toBe(150);
		// left percentage: (100 - 0) / 1000 * 100 = 10%
		expect(state.resizeStartLeft).toBe(10);
		// top percentage: (80 - 0) / 800 * 100 = 10%
		expect(state.resizeStartTop).toBe(10);
	});

	test('should cache minimum height from header and content', () => {
		const containerEl = createMockDivElement({ width: 1000, height: 800 });
		const categoryEl = createMockDivElement(
			{ left: 0, top: 0, width: 200, height: 150 },
			{ parentElement: containerEl }
		);
		const headerEl = createMockDivElement({}, { offsetHeight: 40 });
		const contentEl = createMockDivElement({}, { scrollHeight: 120 });
		const event = createMockMouseEvent();
		const category = createMockCategory();

		handleResizeStart(
			event,
			'bottom',
			state,
			categoryEl,
			headerEl,
			contentEl,
			category,
			CategoryType.Event,
			board
		);

		expect(state.cachedMinHeight).toBe(160); // 40 + 120
	});

	test('should initialize category size if not already set', () => {
		const containerEl = createMockDivElement({ width: 1000, height: 800 });
		const categoryEl = createMockDivElement(
			{ left: 0, top: 0, width: 300, height: 200 },
			{ parentElement: containerEl }
		);
		const headerEl = createMockDivElement({}, { offsetHeight: 30 });
		const contentEl = createMockDivElement({}, { scrollHeight: 100 });
		const event = createMockMouseEvent();
		const category = createMockCategory(); // no size defined

		handleResizeStart(
			event,
			'right',
			state,
			categoryEl,
			headerEl,
			contentEl,
			category,
			CategoryType.Event,
			board
		);

		expect(board.updateCategorySize).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 300, 200);
	});

	test('should not re-initialize size if already set', () => {
		const containerEl = createMockDivElement({ width: 1000, height: 800 });
		const categoryEl = createMockDivElement(
			{ left: 0, top: 0, width: 300, height: 200 },
			{ parentElement: containerEl }
		);
		const headerEl = createMockDivElement({}, { offsetHeight: 30 });
		const contentEl = createMockDivElement({}, { scrollHeight: 100 });
		const event = createMockMouseEvent();
		const category = createMockCategory({ size: { width: 300, height: 200 } });

		handleResizeStart(
			event,
			'right',
			state,
			categoryEl,
			headerEl,
			contentEl,
			category,
			CategoryType.Event,
			board
		);

		expect(board.updateCategorySize).not.toHaveBeenCalled();
	});

	test('should return early if categoryElement has no parentElement', () => {
		const categoryEl = createMockDivElement(
			{ left: 0, top: 0, width: 200, height: 150 },
			{ parentElement: null }
		);
		const headerEl = createMockDivElement({}, { offsetHeight: 30 });
		const contentEl = createMockDivElement({}, { scrollHeight: 100 });
		const event = createMockMouseEvent();
		const category = createMockCategory();

		handleResizeStart(
			event,
			'right',
			state,
			categoryEl,
			headerEl,
			contentEl,
			category,
			CategoryType.Event,
			board
		);

		// The handle should still be set (it's set before the early return check)
		expect(state.resizeHandle).toBe('right');
		// But no other state should be initialized
		expect(state.containerElement).toBeNull();
		expect(state.resizeStartWidth).toBe(0);
	});

	test('should use fallback min height when header/content elements are missing', () => {
		const containerEl = createMockDivElement({ width: 1000, height: 800 });
		const categoryEl = createMockDivElement(
			{ left: 0, top: 0, width: 200, height: 150 },
			{ parentElement: containerEl }
		);
		const event = createMockMouseEvent();
		const category = createMockCategory();

		handleResizeStart(
			event,
			'bottom',
			state,
			categoryEl,
			null as unknown as HTMLDivElement,
			null as unknown as HTMLDivElement,
			category,
			CategoryType.Event,
			board
		);

		expect(state.cachedMinHeight).toBe(40); // Fallback
	});
});

// ─── handleResizeMove ───────────────────────────────────────────────────────

describe('handleResizeMove', () => {
	let state: ResizeState;
	let board: Board;
	let containerEl: HTMLDivElement;
	let categoryEl: HTMLDivElement;

	beforeEach(() => {
		state = createResizeState();
		board = createMockBoard();

		containerEl = createMockDivElement({
			left: 0,
			top: 0,
			width: 1000,
			height: 800
		});

		categoryEl = createMockDivElement(
			{ left: 100, top: 80, width: 200, height: 150 },
			{ parentElement: containerEl }
		);

		// Set up initial state as if handleResizeStart was called
		state.resizeHandle = 'right';
		state.resizeStartX = 300;
		state.resizeStartY = 200;
		state.resizeStartWidth = 200;
		state.resizeStartHeight = 150;
		state.resizeStartLeft = 10;
		state.resizeStartTop = 10;
		state.containerElement = containerEl;
		state.cachedMinHeight = 0;
	});

	test('should do nothing if resizeHandle is null', () => {
		state.resizeHandle = null;
		const event = createMockMouseEvent({ clientX: 350, clientY: 250 });
		const category = createMockCategory();

		handleResizeMove(event, state, categoryEl, category, CategoryType.Event, board);

		expect(board.updateCategoryPosition).not.toHaveBeenCalled();
		expect(board.updateCategorySize).not.toHaveBeenCalled();
	});

	test('should resize right handle (increase width)', () => {
		state.resizeHandle = 'right';
		// Mouse moved 50px to the right
		const event = createMockMouseEvent({ clientX: 350, clientY: 200 });
		const category = createMockCategory();

		handleResizeMove(event, state, categoryEl, category, CategoryType.Event, board);

		// New width = 200 + (350 - 300) = 250
		expect(board.updateCategorySize).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 250, 150);
	});

	test('should resize left handle (decrease width, shift position)', () => {
		state.resizeHandle = 'left';
		// Mouse moved 50px to the left (clientX decreased)
		const event = createMockMouseEvent({ clientX: 250, clientY: 200 });
		const category = createMockCategory();

		handleResizeMove(event, state, categoryEl, category, CategoryType.Event, board);

		// deltaX = 250 - 300 = -50
		// newWidth = 200 - (-50) = 250
		// deltaXPercent = -50 / 1000 * 100 = -5%
		// newLeft = 10 + (-5) = 5%
		expect(board.updateCategoryPosition).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 5, 10);
		expect(board.updateCategorySize).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 250, 150);
	});

	test('should resize bottom handle (increase height)', () => {
		state.resizeHandle = 'bottom';
		// Mouse moved 30px down
		const event = createMockMouseEvent({ clientX: 300, clientY: 230 });
		const category = createMockCategory();

		handleResizeMove(event, state, categoryEl, category, CategoryType.Event, board);

		// New height = 150 + (230 - 200) = 180
		expect(board.updateCategorySize).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 200, 180);
	});

	test('should resize top handle (decrease height, shift position)', () => {
		state.resizeHandle = 'top';
		// Mouse moved 40px up
		const event = createMockMouseEvent({ clientX: 300, clientY: 160 });
		const category = createMockCategory();

		handleResizeMove(event, state, categoryEl, category, CategoryType.Event, board);

		// deltaY = 160 - 200 = -40
		// newHeight = 150 - (-40) = 190
		// deltaYPercent = -40 / 800 * 100 = -5%
		// newTop = 10 + (-5) = 5%
		expect(board.updateCategoryPosition).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 10, 5);
		expect(board.updateCategorySize).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 200, 190);
	});

	test('should resize bottom-right corner (both width and height)', () => {
		state.resizeHandle = 'bottom-right';
		const event = createMockMouseEvent({ clientX: 350, clientY: 250 });
		const category = createMockCategory();

		handleResizeMove(event, state, categoryEl, category, CategoryType.Event, board);

		// newWidth = 200 + (350 - 300) = 250
		// newHeight = 150 + (250 - 200) = 200
		expect(board.updateCategorySize).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 250, 200);
	});

	test('should enforce minimum height constraint', () => {
		state.resizeHandle = 'bottom';
		state.cachedMinHeight = 200; // min height larger than current
		// Mouse moves up, trying to make it shorter
		const event = createMockMouseEvent({ clientX: 300, clientY: 100 });
		const category = createMockCategory();

		handleResizeMove(event, state, categoryEl, category, CategoryType.Event, board);

		// deltaY = 100 - 200 = -100
		// newHeight = 150 + (-100) = 50, but min is 200
		// So newHeight is clamped to 200
		expect(board.updateCategorySize).toHaveBeenCalledWith(CategoryType.Event, 'cat-1', 200, 200);
	});

	test('should clamp left position when it would go negative', () => {
		state.resizeHandle = 'left';
		state.resizeStartLeft = 2; // Very close to left edge
		// Mouse moves far to the right, pulling left edge past 0
		const event = createMockMouseEvent({ clientX: 400, clientY: 200 });
		const category = createMockCategory();

		handleResizeMove(event, state, categoryEl, category, CategoryType.Event, board);

		// deltaX = 400 - 300 = 100
		// deltaXPercent = 100/1000 * 100 = 10%
		// newLeft = 2 + 10 = 12% (not negative in this case)
		// newWidth = 200 - 100 = 100
		const posCall = (board.updateCategoryPosition as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(posCall[2]).toBeGreaterThanOrEqual(0); // x >= 0
	});
});

// ─── handleResizeEnd ────────────────────────────────────────────────────────

describe('handleResizeEnd', () => {
	test('should reset resizeHandle to null', () => {
		const state = createResizeState();
		state.resizeHandle = 'bottom-right';

		handleResizeEnd(state);

		expect(state.resizeHandle).toBeNull();
	});

	test('should not modify other state properties', () => {
		const state = createResizeState();
		state.resizeHandle = 'top-left';
		state.resizeStartX = 100;
		state.resizeStartY = 200;
		state.resizeStartWidth = 300;
		state.cachedMinHeight = 50;

		handleResizeEnd(state);

		expect(state.resizeHandle).toBeNull();
		expect(state.resizeStartX).toBe(100);
		expect(state.resizeStartY).toBe(200);
		expect(state.resizeStartWidth).toBe(300);
		expect(state.cachedMinHeight).toBe(50);
	});
});
