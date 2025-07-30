import { UndoManagerFactory } from '../../../persistence/undo/UndoManagerFactory';

export function redo() {
	const undoManager = UndoManagerFactory.getInstance();
	undoManager.redo();
}
