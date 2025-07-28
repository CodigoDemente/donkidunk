import { StateHistory } from 'runed';
import type { BoardData } from '../stores/board/types/Board';
import type { TimelineData } from '../stores/timeline/types/Timeline';
import { Scope } from './types/Scope';
import type { UndoEditionStack } from './types/UndoEditionStack';

export class UndoManager {
	private boardHistory: StateHistory<BoardData>;
	private timelineHistory: StateHistory<TimelineData>;
	private editions: UndoEditionStack;

	private constructor(
		boardStore: {
			boardStoreGetter: () => BoardData;
			boardStoreSetter: (newState: BoardData) => void;
		},
		timelineStore: {
			timelineStoreGetter: () => TimelineData;
			timelineStoreSetter: (newState: TimelineData) => void;
		}
	) {
		this.boardHistory = new StateHistory(boardStore.boardStoreGetter, boardStore.boardStoreSetter);
		this.timelineHistory = new StateHistory(
			timelineStore.timelineStoreGetter,
			timelineStore.timelineStoreSetter
		);

		this.editions = {
			undoStack: [],
			redoStack: []
		};
	}

	public static create(
		boardStore: {
			boardStoreGetter: () => BoardData;
			boardStoreSetter: (newState: BoardData) => void;
		},
		timelineStore: {
			timelineStoreGetter: () => TimelineData;
			timelineStoreSetter: (newState: TimelineData) => void;
		}
	): UndoManager {
		return new UndoManager(boardStore, timelineStore);
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
	}
}
