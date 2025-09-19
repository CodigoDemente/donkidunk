import { listen } from '@tauri-apps/api/event';
import {
	setRedoEnablingStatus,
	setUndoEnablingStatus
} from '../modules/menu/operations/enableItems';
import type { UndoEnablingState } from './types/UndoEnablingState';

export class UndoManagerEventHandler {
	private unlisteners: (() => void)[] = [];
	private undoEnablingState: UndoEnablingState;

	constructor() {
		this.undoEnablingState = {
			undo: false,
			redo: false
		};
	}

	async init(): Promise<void> {
		this.unlisteners.push(
			await listen('undo:updated', () => {
				if (!this.undoEnablingState.undo) {
					this.undoEnablingState.undo = true;
					return setUndoEnablingStatus(true);
				}
			})
		);
		this.unlisteners.push(
			await listen('undo:empty', () => {
				if (this.undoEnablingState.undo) {
					this.undoEnablingState.undo = false;
					return setUndoEnablingStatus(false);
				}
			})
		);

		this.unlisteners.push(
			await listen('redo:updated', () => {
				if (!this.undoEnablingState.redo) {
					this.undoEnablingState.redo = true;
					return setRedoEnablingStatus(true);
				}
			})
		);
		this.unlisteners.push(
			await listen('redo:empty', () => {
				if (this.undoEnablingState.redo) {
					this.undoEnablingState.redo = false;
					return setRedoEnablingStatus(false);
				}
			})
		);
	}

	destroy(): void {
		for (const unlisten of this.unlisteners) {
			unlisten();
		}
		this.unlisteners = [];
	}
}
