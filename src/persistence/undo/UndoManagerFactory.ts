import type { UndoManagerBoardFunctions } from './types/UndoManagerBoardFunctions';
import type { UndoManagerTimelineFunctions } from './types/UndoManagerTimelineFunctions';
import { UndoManager } from './UndoManager';

export class UndoManagerFactory {
	private static instance: UndoManager;

	private constructor() {}

	public static createInstance(
		boardFunctions: UndoManagerBoardFunctions,
		timelineFunctions: UndoManagerTimelineFunctions
	): UndoManager {
		if (!this.instance) {
			this.instance = new UndoManager(boardFunctions, timelineFunctions);
		}
		return this.instance;
	}

	public static getInstance(): UndoManager {
		if (!this.instance) {
			throw new Error('UndoManager instance not created');
		}
		return this.instance;
	}
}
