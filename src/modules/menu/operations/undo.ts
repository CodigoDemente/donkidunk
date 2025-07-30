import { UndoManagerFactory } from '../../../persistence/undo/UndoManagerFactory';

export function undo() {
	const undoManager = UndoManagerFactory.getInstance();
	undoManager.undo();
}
