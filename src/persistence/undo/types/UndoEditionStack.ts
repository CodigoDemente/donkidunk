import type { Scope } from './Scope';

export type UndoEditionStack = {
	undoStack: Scope[];
	redoStack: Scope[];
};
