import type { BoardData } from '../../stores/board/types/Board';

export type UndoManagerBoardFunctions = {
	boardStoreGetter: () => BoardData;
	boardStoreSetter: (newState: BoardData) => void;
};
