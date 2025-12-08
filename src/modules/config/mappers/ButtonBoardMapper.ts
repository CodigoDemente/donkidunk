import type { BackendButtonBoard } from '../types/BackendButtonBoard';
import type { ButtonBoard } from '../types/ButtonBoard';

export class ButtonBoardMapper {
	static toDomain(backendButtonBoard: BackendButtonBoard): ButtonBoard {
		return {
			path: backendButtonBoard.path,
			id: backendButtonBoard.button_board.id,
			name: backendButtonBoard.button_board.name,
			isDefault: backendButtonBoard.button_board.is_default
		};
	}
}
