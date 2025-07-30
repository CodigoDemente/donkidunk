import { StateHistory } from 'runed';
import type { BoardData } from '../stores/board/types/Board';
import type { TimelineData } from '../stores/timeline/types/Timeline';
import { Scope } from './types/Scope';
import type { UndoEditionStack } from './types/UndoEditionStack';
import { emit } from '@tauri-apps/api/event';
import type { UndoManagerBoardFunctions } from './types/UndoManagerBoardFunctions';
import type { UndoManagerTimelineFunctions } from './types/UndoManagerTimelineFunctions';

export class UndoManager {
	private boardHistory: StateHistory<BoardData>;
	private timelineHistory: StateHistory<TimelineData>;
	private editions: UndoEditionStack;

	constructor(boardStore: UndoManagerBoardFunctions, timelineStore: UndoManagerTimelineFunctions) {
		this.boardHistory = new StateHistory(
			() => boardStore.boardStoreGetter(),
			(value) => boardStore.boardStoreSetter(value)
		);
		this.timelineHistory = new StateHistory(
			() => timelineStore.timelineStoreGetter(),
			(value) => timelineStore.timelineStoreSetter(value)
		);

		this.editions = {
			undoStack: [],
			redoStack: []
		};
	}

	public addBoardEdition(): void {
		this.addEdition(Scope.Board);
	}

	public addTimelineEdition(): void {
		this.addEdition(Scope.Timeline);
	}

	private addEdition(scope: Scope): void {
		this.editions.undoStack.push(scope);

		if (this.editions.redoStack.length > 0) {
			this.editions.redoStack = [];
		}

		emit('undo:updated');
		emit('redo:empty');
	}

	public undo(): void {
		if (this.editions.undoStack.length === 0) return;

		const scope = this.editions.undoStack.pop();
		if (scope) {
			this.editions.redoStack.push(scope);
		}

		switch (scope) {
			case Scope.Board:
				this.boardHistory.undo();
				break;
			case Scope.Timeline:
				this.timelineHistory.undo();
				break;
		}

		if (this.editions.undoStack.length === 0) {
			emit('undo:empty');
		}
		if (this.editions.redoStack.length !== 0) {
			emit('redo:updated');
		}
	}

	public redo(): void {
		if (this.editions.redoStack.length === 0) return;

		const scope = this.editions.redoStack.pop();
		if (scope) {
			this.editions.undoStack.push(scope);
		}

		switch (scope) {
			case Scope.Board:
				this.boardHistory.redo();
				break;
			case Scope.Timeline:
				this.timelineHistory.redo();
				break;
		}

		if (this.editions.redoStack.length === 0) {
			emit('redo:empty');
		}
		if (this.editions.undoStack.length !== 0) {
			emit('undo:updated');
		}
	}
}
