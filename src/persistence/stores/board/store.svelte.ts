import type { BoardData } from './types/Board';

const initialState: BoardData = {
	isEditing: false,
	eventCategories: [],
	tagsRelatedToEvents: [],
	actionCategories: []
};

let boardStore = $state<BoardData>(initialState);

export default class BoardStore {
	static get state() {
		return boardStore;
	}

	static set state(newState: BoardData) {
		boardStore = newState;
	}

	static reset() {
		boardStore = initialState;
	}
}
