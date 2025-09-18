import type { BoardData } from './types/Board';

export const categoryState = {
	id: undefined,
	name: '',
	color: '',
	position: { x: 0, y: 0 },
	buttons: []
};

const initialState: BoardData = {
	isEditing: false,
	eventCategories: [],
	tagsRelatedToEvents: [],
	actionCategories: [],
	category: { ...categoryState }
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
