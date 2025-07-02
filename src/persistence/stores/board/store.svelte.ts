import type { BoardData } from './types/Board';

const initialState: BoardData = {
	isEditing: false,
	eventCategories: [],
	tagsRelatedToEvents: [],
	actionCategories: []
};

const boardStore = $state<BoardData>(initialState);

export default boardStore;
