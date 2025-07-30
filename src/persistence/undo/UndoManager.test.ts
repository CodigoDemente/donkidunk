import { describe, test, expect, vi, beforeEach } from 'vitest';
import { UndoManager } from './UndoManager';
import type { BoardData } from '../stores/board/types/Board';
import type { TimelineData } from '../stores/timeline/types/Timeline';
import { StateHistory } from 'runed';
import { emit } from '@tauri-apps/api/event';

// Mock StateHistory from runed library
vi.mock('runed', () => ({
	StateHistory: vi.fn().mockImplementation((getter, setter) => ({
		undo: vi.fn(),
		redo: vi.fn(),
		_getter: getter,
		_setter: setter
	}))
}));

vi.mock('@tauri-apps/api/event', () => ({
	emit: vi.fn()
}));

const mockStateHistory = vi.mocked(StateHistory);
const mockEmit = vi.mocked(emit);

describe('UndoManager', () => {
	let mockBoardStore: {
		boardStoreGetter: () => BoardData;
		boardStoreSetter: (newState: BoardData) => void;
	};

	let mockTimelineStore: {
		timelineStoreGetter: () => TimelineData;
		timelineStoreSetter: (newState: TimelineData) => void;
	};

	let undoManager: UndoManager;

	// Mock data for the stores
	const mockBoardData: BoardData = {
		isEditing: false,
		eventCategories: [],
		actionCategories: [],
		tagsRelatedToEvents: []
	};

	const mockTimelineData: TimelineData = {
		onPlay: null,
		eventSelected: null,
		eventTimeline: [],
		actionTimeline: []
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Configure store mocks
		mockBoardStore = {
			boardStoreGetter: vi.fn().mockReturnValue(mockBoardData),
			boardStoreSetter: vi.fn()
		};

		mockTimelineStore = {
			timelineStoreGetter: vi.fn().mockReturnValue(mockTimelineData),
			timelineStoreSetter: vi.fn()
		};

		// Create a new UndoManager instance
		undoManager = new UndoManager(mockBoardStore, mockTimelineStore);
	});

	describe('create', () => {
		test('should create an UndoManager instance', () => {
			expect(undoManager).toBeInstanceOf(UndoManager);
		});

		test('should initialize StateHistory for board and timeline', () => {
			expect(mockStateHistory).toHaveBeenCalledTimes(2);
			expect(mockStateHistory).toHaveBeenCalledWith(
				mockBoardStore.boardStoreGetter,
				mockBoardStore.boardStoreSetter
			);
			expect(mockStateHistory).toHaveBeenCalledWith(
				mockTimelineStore.timelineStoreGetter,
				mockTimelineStore.timelineStoreSetter
			);
		});
	});

	describe('addBoardEdition', () => {
		test('should add Board scope to undo stack', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			// Add two board editions
			undoManager.addBoardEdition();
			undoManager.addBoardEdition();

			// First undo should call board undo
			undoManager.undo();
			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(1);
			expect(mockTimelineHistory.undo).not.toHaveBeenCalled();

			// Second undo should also call board undo (second edition)
			undoManager.undo();
			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(2);
			expect(mockTimelineHistory.undo).not.toHaveBeenCalled();

			// Third undo should do nothing (empty stack)
			undoManager.undo();
			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(2);
			expect(mockTimelineHistory.undo).not.toHaveBeenCalled();
		});

		test('should clear redo stack when adding new edition', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			// Add edition and undo it (to create redo state)
			undoManager.addBoardEdition();
			undoManager.undo();

			// Verify redo works
			undoManager.redo();
			expect(mockBoardHistory.redo).toHaveBeenCalledTimes(1);

			// Add new edition should clear redo stack
			undoManager.addBoardEdition();

			// Clear mocks to test redo after new edition
			vi.clearAllMocks();

			// Redo should do nothing now (redo stack was cleared)
			undoManager.redo();
			expect(mockBoardHistory.redo).not.toHaveBeenCalled();
			expect(mockTimelineHistory.redo).not.toHaveBeenCalled();
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
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			// Add two timeline editions
			undoManager.addTimelineEdition();
			undoManager.addTimelineEdition();

			// First undo should call timeline undo
			undoManager.undo();
			expect(mockTimelineHistory.undo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.undo).not.toHaveBeenCalled();

			// Second undo should also call timeline undo (second edition)
			undoManager.undo();
			expect(mockTimelineHistory.undo).toHaveBeenCalledTimes(2);
			expect(mockBoardHistory.undo).not.toHaveBeenCalled();

			// Third undo should do nothing (empty stack)
			undoManager.undo();
			expect(mockTimelineHistory.undo).toHaveBeenCalledTimes(2);
			expect(mockBoardHistory.undo).not.toHaveBeenCalled();
		});

		test('should clear redo stack when adding new edition', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			// Add edition and undo it (to create redo state)
			undoManager.addTimelineEdition();
			undoManager.undo();

			// Verify redo works
			undoManager.redo();
			expect(mockTimelineHistory.redo).toHaveBeenCalledTimes(1);

			// Add new edition should clear redo stack
			undoManager.addTimelineEdition();

			// Clear mocks to test redo after new edition
			vi.clearAllMocks();

			// Redo should do nothing now (redo stack was cleared)
			undoManager.redo();
			expect(mockBoardHistory.redo).not.toHaveBeenCalled();
			expect(mockTimelineHistory.redo).not.toHaveBeenCalled();
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
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			undoManager.undo();

			expect(mockBoardHistory.undo).not.toHaveBeenCalled();
			expect(mockTimelineHistory.undo).not.toHaveBeenCalled();
		});

		test('should undo board changes when last edition was Board scope', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			undoManager.addBoardEdition();
			undoManager.undo();

			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(1);
			expect(mockTimelineHistory.undo).not.toHaveBeenCalled();
		});

		test('should undo timeline changes when last edition was Timeline scope', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			undoManager.addTimelineEdition();
			undoManager.undo();

			expect(mockTimelineHistory.undo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.undo).not.toHaveBeenCalled();
		});

		test('should move undone scope to redo stack', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			// Add board edition and undo it
			undoManager.addBoardEdition();
			undoManager.undo();

			// Clear mocks to verify only redo calls
			vi.clearAllMocks();

			// Verify that redo now works (scope was moved to redo stack)
			undoManager.redo();
			expect(mockBoardHistory.redo).toHaveBeenCalledTimes(1);
			expect(mockTimelineHistory.redo).not.toHaveBeenCalled();
		});

		test('should handle multiple undos in correct order (LIFO)', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			// Add editions in order: Board, Board, Timeline
			// This sequence will detect if FIFO is incorrectly used instead of LIFO
			undoManager.addBoardEdition(); // First: Board
			undoManager.addBoardEdition(); // Second: Board
			undoManager.addTimelineEdition(); // Third: Timeline

			// LIFO (correct): Should undo Timeline, Board, Board
			// FIFO (incorrect): Would undo Board, Board, Timeline
			undoManager.undo(); // Should undo Timeline (last added)
			expect(mockTimelineHistory.undo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(0);

			undoManager.undo(); // Should undo second Board
			expect(mockTimelineHistory.undo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(1);

			undoManager.undo(); // Should undo first Board
			expect(mockTimelineHistory.undo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(2);
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
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			undoManager.redo();

			expect(mockBoardHistory.redo).not.toHaveBeenCalled();
			expect(mockTimelineHistory.redo).not.toHaveBeenCalled();
		});

		test('should redo board changes when last undone was Board scope', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			undoManager.addBoardEdition();
			undoManager.undo();
			undoManager.redo();

			expect(mockBoardHistory.redo).toHaveBeenCalledTimes(1);
			expect(mockTimelineHistory.redo).not.toHaveBeenCalled();
		});

		test('should redo timeline changes when last undone was Timeline scope', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			undoManager.addTimelineEdition();
			undoManager.undo();
			undoManager.redo();

			expect(mockTimelineHistory.redo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.redo).not.toHaveBeenCalled();
		});

		test('should move redone scope back to undo stack', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

			// Add board edition, undo and redo it
			undoManager.addBoardEdition();
			undoManager.undo();
			undoManager.redo();

			// Clear mocks to verify only the next undo call
			vi.clearAllMocks();

			// Verify that undo works again (scope was moved back to undo stack)
			undoManager.undo();
			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(1);
			expect(mockTimelineHistory.undo).not.toHaveBeenCalled();
		});

		test('should handle multiple redos in correct order (LIFO)', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

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
			expect(mockTimelineHistory.redo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.redo).toHaveBeenCalledTimes(0);

			undoManager.redo(); // Should redo first Board
			expect(mockTimelineHistory.redo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.redo).toHaveBeenCalledTimes(1);

			undoManager.redo(); // Should redo second Board
			expect(mockTimelineHistory.redo).toHaveBeenCalledTimes(1);
			expect(mockBoardHistory.redo).toHaveBeenCalledTimes(2);
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
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

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
			expect(mockBoardHistory.undo).toHaveBeenCalledTimes(4); // B3, B2, B4, B1
			expect(mockTimelineHistory.undo).toHaveBeenCalledTimes(1); // T1

			// 6. Redo some
			undoManager.redo(); // Redoes B1
			undoManager.redo(); // Redoes T1

			expect(mockBoardHistory.redo).toHaveBeenCalledTimes(1); // B1
			expect(mockTimelineHistory.redo).toHaveBeenCalledTimes(1); // T1
		});

		test('should maintain stack integrity after multiple operations', () => {
			const mockBoardHistory = mockStateHistory.mock.results[0].value;
			const mockTimelineHistory = mockStateHistory.mock.results[1].value;

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
			expect(mockBoardHistory.undo).toHaveBeenCalled();
			expect(mockTimelineHistory.undo).toHaveBeenCalled();
			expect(mockBoardHistory.redo).toHaveBeenCalled();
		});
	});
});
