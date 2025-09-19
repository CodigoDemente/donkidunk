/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BoardActions } from '../../modules/board/types/BoardActions';
import { Scope } from './types/Scope';
import type { UndoManager } from './UndoManager';
import { UndoManagerFactory } from './UndoManagerFactory';

type IsOneOf<T, F> = {
	[P in keyof T]: F extends T[P] ? (T[P] extends F ? T[P] : never) : never;
}[keyof T];

const wrapper =
	<U extends (...args: any[]) => any>(
		func: U extends IsOneOf<BoardActions, U> ? U : never,
		manager: UndoManager,
		scope: Scope
	) =>
	(...args: Parameters<U>): ReturnType<U> => {
		const result = func(...args);

		if (result instanceof Promise) {
			return result.then((res: any) => {
				addEdition(manager, scope);
				return res;
			}) as ReturnType<U>;
		} else {
			addEdition(manager, scope);
			return result;
		}
	};

export function wrapObjectForUndo<T extends Record<string, (...args: any[]) => any>>(
	state: T,
	scope: Scope
): T {
	const undoManager = UndoManagerFactory.getInstance();

	return Object.fromEntries(
		Object.entries(state).map(([key, func]) => [key, wrapper(func, undoManager, scope)])
	) as T;
}

function addEdition(undoManager: UndoManager, scope: Scope) {
	if (scope === Scope.Board) {
		undoManager.addBoardEdition();
	} else if (scope === Scope.Timeline) {
		undoManager.addTimelineEdition();
	} else {
		throw new Error(`Unknown scope: ${scope}`);
	}
}
