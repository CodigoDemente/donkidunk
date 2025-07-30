import type { BoardData } from './types/Board';

const initialState: BoardData = {
	isEditing: false,
	eventCategories: [],
	tagsRelatedToEvents: [],
	actionCategories: []
};

let boardStore = $state<BoardData>(initialState);

export default class BoardStore {
	static getState() {
		return boardStore;
	}

	static setState(newState: BoardData) {
		boardStore = newState;
	}

	static reset() {
		boardStore = initialState;
	}
}
