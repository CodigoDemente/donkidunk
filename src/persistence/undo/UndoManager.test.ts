import { describe, test, expect, vi, beforeEach } from 'vitest';
import { UndoManager } from './UndoManager';
import { emit } from '@tauri-apps/api/event';
import type { Board } from '../../modules/board/context.svelte';
import type { Timeline } from '../../modules/videoplayer/context.svelte';

// Mock board context
const mockBoardContext: Pick<Board, 'undo' | 'redo'> = {
	undo: vi.fn(),
	redo: vi.fn()
};

// Mock timeline context
const mockTimelineContext: Pick<Timeline, 'undo' | 'redo'> = {
	undo: vi.fn(),
	redo: vi.fn()
};

vi.mock('@tauri-apps/api/event', () => ({
	emit: vi.fn()
}));

const mockEmit = vi.mocked(emit);

describe('UndoManager', () => {
	let undoManager: UndoManager;

	beforeEach(() => {
		vi.clearAllMocks();
		undoManager = new UndoManager(mockBoardContext as Board, mockTimelineContext as Timeline);
	});

	describe('create', () => {
		test('should create an UndoManager instance', () => {
			expect(undoManager).toBeInstanceOf(UndoManager);
		});
	});

	describe('addBoardEdition', () => {
		test('should add Board scope to undo stack', () => {
			// Add two board editions
			undoManager.addBoardEdition();
			undoManager.addBoardEdition();

			// First undo should call board undo
			undoManager.undo();
			expect(mockBoardContext.undo).toHaveBeenCalledTimes(1);

			// Second undo should also call board undo (second edition)
			undoManager.undo();
			expect(mockBoardContext.undo).toHaveBeenCalledTimes(2);

			// Third undo should do nothing (empty stack)
			undoManager.undo();
			expect(mockBoardContext.undo).toHaveBeenCalledTimes(2);
		});

		test('should clear redo stack when adding new edition', () => {
			// Add edition and undo it (to create redo state)
			undoManager.addBoardEdition();
			undoManager.undo();

			// Verify redo works
			undoManager.redo();
			expect(mockBoardContext.redo).toHaveBeenCalledTimes(1);

			// Add new edition should clear redo stack
			undoManager.addBoardEdition();

			// Clear mocks to test redo after new edition
			vi.clearAllMocks();

			// Redo should do nothing now (redo stack was cleared)
			undoManager.redo();
			expect(mockBoardContext.redo).not.toHaveBeenCalled();
		});

		test('should emit undo:updated event when adding edition', () => {
			undoManager.addBoardEdition();
			expect(mockEmit).toHaveBeenCalledWith('undo:updated');
		});

		test('should emit redo:empty event when adding edition', () => {
			undoManager.addBoardEdition();
			expect(mockEmit).toHaveBeenCalledWith('redo:empty');
		});
	});

	describe('addTimelineEdition', () => {
		test('should add Timeline scope to undo stack', () => {
			// Add two timeline editions
			undoManager.addTimelineEdition();
			undoManager.addTimelineEdition();

			// Timeline undo is not implemented yet, so nothing should be called
			// First undo should process timeline scope but not call anything
			undoManager.undo();
			expect(mockBoardContext.undo).not.toHaveBeenCalled();

			// Second undo should also process timeline scope
			undoManager.undo();
			expect(mockBoardContext.undo).not.toHaveBeenCalled();

			// Third undo should do nothing (empty stack)
			undoManager.undo();
			expect(mockBoardContext.undo).not.toHaveBeenCalled();
		});

		test('should clear redo stack when adding new edition', () => {
			// Add edition and undo it (to create redo state)
			undoManager.addTimelineEdition();
			undoManager.undo();

			// Verify redo works (even if timeline doesn't do anything)
			undoManager.redo();

			// Add new edition should clear redo stack
			undoManager.addTimelineEdition();

			// Clear mocks to test redo after new edition
			vi.clearAllMocks();

			// Redo should do nothing now (redo stack was cleared)
			undoManager.redo();
			expect(mockBoardContext.redo).not.toHaveBeenCalled();
		});

		test('should emit undo:updated event when adding edition', () => {
			undoManager.addTimelineEdition();
			expect(mockEmit).toHaveBeenCalledWith('undo:updated');
		});

		test('should emit redo:empty event when adding edition', () => {
			undoManager.addTimelineEdition();
			expect(mockEmit).toHaveBeenCalledWith('redo:empty');
		});
	});

	describe('undo', () => {
		test('should do nothing when undo stack is empty', () => {
			undoManager.undo();
			expect(mockBoardContext.undo).not.toHaveBeenCalled();
		});

		test('should undo board changes when last edition was Board scope', () => {
			undoManager.addBoardEdition();
			undoManager.undo();

			expect(mockBoardContext.undo).toHaveBeenCalledTimes(1);
		});

		test('should undo timeline changes when last edition was Timeline scope', () => {
			undoManager.addTimelineEdition();
			undoManager.undo();

			// Timeline undo is not implemented yet, so board undo should not be called
			expect(mockBoardContext.undo).not.toHaveBeenCalled();
		});

		test('should move undone scope to redo stack', () => {
			// Add board edition and undo it
			undoManager.addBoardEdition();
			undoManager.undo();

			// Clear mocks to verify only redo calls
			vi.clearAllMocks();

			// Verify that redo now works (scope was moved to redo stack)
			undoManager.redo();
			expect(mockBoardContext.redo).toHaveBeenCalledTimes(1);
		});

		test('should handle multiple undos in correct order (LIFO)', () => {
			// Add editions in order: Board, Board, Timeline
			// This sequence will detect if FIFO is incorrectly used instead of LIFO
			undoManager.addBoardEdition(); // First: Board
			undoManager.addBoardEdition(); // Second: Board
			undoManager.addTimelineEdition(); // Third: Timeline

			// LIFO (correct): Should undo Timeline, Board, Board
			// FIFO (incorrect): Would undo Board, Board, Timeline
			undoManager.undo(); // Should undo Timeline (last added)
			expect(mockBoardContext.undo).toHaveBeenCalledTimes(0); // Timeline doesn't call board undo

			undoManager.undo(); // Should undo second Board
			expect(mockBoardContext.undo).toHaveBeenCalledTimes(1);

			undoManager.undo(); // Should undo first Board
			expect(mockBoardContext.undo).toHaveBeenCalledTimes(2);
		});

		test('should emit undo:empty when undo stack is empty after undo', () => {
			undoManager.addBoardEdition();
			undoManager.undo();

			expect(mockEmit).toHaveBeenCalledWith('undo:empty');
		});

		test('should emit redo:updated when redo stack is not empty', () => {
			undoManager.addBoardEdition();
			undoManager.undo();

			expect(mockEmit).toHaveBeenCalledWith('redo:updated');
		});
	});

	describe('redo', () => {
		test('should do nothing when redo stack is empty', () => {
			undoManager.redo();
			expect(mockBoardContext.redo).not.toHaveBeenCalled();
		});

		test('should redo board changes when last undone was Board scope', () => {
			undoManager.addBoardEdition();
			undoManager.undo();
			undoManager.redo();

			expect(mockBoardContext.redo).toHaveBeenCalledTimes(1);
		});

		test('should redo timeline changes when last undone was Timeline scope', () => {
			undoManager.addTimelineEdition();
			undoManager.undo();
			undoManager.redo();

			// Timeline redo is not implemented yet, so board redo should not be called
			expect(mockBoardContext.redo).not.toHaveBeenCalled();
		});

		test('should move redone scope back to undo stack', () => {
			// Add board edition, undo and redo it
			undoManager.addBoardEdition();
			undoManager.undo();
			undoManager.redo();

			// Clear mocks to verify only the next undo call
			vi.clearAllMocks();

			// Verify that undo works again (scope was moved back to undo stack)
			undoManager.undo();
			expect(mockBoardContext.undo).toHaveBeenCalledTimes(1);
		});

		test('should handle multiple redos in correct order (LIFO)', () => {
			// Add and undo multiple editions: Timeline, Board, Board
			// This sequence will detect if FIFO is incorrectly used instead of LIFO
			undoManager.addTimelineEdition(); // First: Timeline
			undoManager.addBoardEdition(); // Second: Board
			undoManager.addBoardEdition(); // Third: Board

			// Undo all (LIFO: Board, Board, Timeline)
			undoManager.undo(); // Board (third)
			undoManager.undo(); // Board (second)
			undoManager.undo(); // Timeline (first)

			// Clear mocks to count only redos
			vi.clearAllMocks();

			// LIFO (correct): Should redo Timeline, Board, Board
			// FIFO (incorrect): Would redo Board, Board, Timeline
			undoManager.redo(); // Should redo Timeline (first undone, so first to redo in LIFO)
			expect(mockBoardContext.redo).toHaveBeenCalledTimes(0); // Timeline doesn't call board redo

			undoManager.redo(); // Should redo first Board
			expect(mockBoardContext.redo).toHaveBeenCalledTimes(1);

			undoManager.redo(); // Should redo second Board
			expect(mockBoardContext.redo).toHaveBeenCalledTimes(2);
		});

		test('should emit redo:empty when redo stack is empty after redo', () => {
			undoManager.addBoardEdition();
			undoManager.undo();
			undoManager.redo();

			expect(mockEmit).toHaveBeenCalledWith('redo:empty');
		});

		test('should emit undo:updated when undo stack is not empty', () => {
			undoManager.addBoardEdition();
			undoManager.undo();
			undoManager.redo();

			expect(mockEmit).toHaveBeenCalledWith('undo:updated');
		});
	});

	describe('Integration tests', () => {
		test('should handle complex undo/redo scenarios', () => {
			// Complex scenario:
			// 1. Add 3 board editions
			undoManager.addBoardEdition(); // B1
			undoManager.addBoardEdition(); // B2
			undoManager.addBoardEdition(); // B3

			// 2. Undo 2
			undoManager.undo(); // Undoes B3
			undoManager.undo(); // Undoes B2

			// 3. Add timeline edition (should clear redo stack)
			undoManager.addTimelineEdition(); // T1

			// 4. Add another board edition
			undoManager.addBoardEdition(); // B4

			// 5. Undo everything possible
			undoManager.undo(); // Undoes B4
			undoManager.undo(); // Undoes T1
			undoManager.undo(); // Undoes B1

			// Verify correct methods were called
			expect(mockBoardContext.undo).toHaveBeenCalledTimes(4); // B3, B2, B4, B1

			// 6. Redo some
			undoManager.redo(); // Redoes B1
			undoManager.redo(); // Redoes T1

			expect(mockBoardContext.redo).toHaveBeenCalledTimes(1); // B1 (T1 doesn't call board redo)
		});

		test('should maintain stack integrity after multiple operations', () => {
			// Perform multiple operations
			undoManager.addBoardEdition();
			undoManager.addTimelineEdition();
			undoManager.undo();
			undoManager.addBoardEdition();
			undoManager.undo();
			undoManager.undo();
			undoManager.redo();
			undoManager.addTimelineEdition();

			// The fact that this doesn't throw errors and the mocks are called correctly
			// proves that the stacks maintain their integrity
			expect(mockBoardContext.undo).toHaveBeenCalled();
			expect(mockBoardContext.redo).toHaveBeenCalled();
		});
	});
});
