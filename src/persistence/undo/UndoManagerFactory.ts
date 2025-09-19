import { UndoManager } from './UndoManager';

export class UndoManagerFactory {
	private static instance: UndoManager;

	private constructor() {}

	public static getInstance(): UndoManager {
		if (!this.instance) {
			this.instance = new UndoManager();
		}
		return this.instance;
	}
}
