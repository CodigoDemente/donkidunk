import { Scope } from './types/Scope';
import type { UndoEditionStack } from './types/UndoEditionStack';
import { emit } from '@tauri-apps/api/event';
import { boardContext, type Board } from '../../modules/board/context.svelte';
import { timelineContext, type Timeline } from '../../modules/videoplayer/context.svelte';

export class UndoManager {
	private boardContext: Board;
	private timelineContext: Timeline;
	private editions: UndoEditionStack;

	constructor(boardContextInstance?: Board, timelineContextInstance?: Timeline) {
		this.boardContext = boardContextInstance || boardContext.get();
		this.timelineContext = timelineContextInstance || timelineContext.get();

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
				this.boardContext.undo();
				break;
			case Scope.Timeline:
				this.timelineContext.undo();
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
				this.boardContext.redo();
				break;
			case Scope.Timeline:
				this.timelineContext.redo();
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
