import { Context } from 'runed';
import { Locale, UIMode, type BoardSize, type ConfigData } from './types/Config';
import type { ButtonBoard } from './types/ButtonBoard';
import type { NewButtonBoardFormData } from './types/NewButtonBoardFormData';

const initialState: ConfigData = {
	locale: Locale.EN,
	uiMode: UIMode.Simple,
	boardSize: {
		events: 30,
		tags: 70
	}
};

export const configContext = new Context<Config>('');

export class Config {
	#state = $state<ConfigData>(initialState);
	#buttonBoards = $state<ButtonBoard[]>([]);
	#newButtonBoardFormData = $state<NewButtonBoardFormData | null>(null);

	constructor() {}

	// region Getters

	get state() {
		return this.#state;
	}

	get locale() {
		return this.#state.locale;
	}

	get uiMode() {
		return this.#state.uiMode;
	}

	get boardSize() {
		return this.#state.boardSize;
	}

	get defaultButtonBoard() {
		return this.#buttonBoards.find((buttonBoard) => buttonBoard.isDefault) ?? this.#buttonBoards[0];
	}

	get buttonBoards() {
		return this.#buttonBoards;
	}

	get newButtonBoardFormData() {
		return this.#newButtonBoardFormData;
	}

	// region Setters
	set state(value: ConfigData) {
		this.#state = value;
	}

	set locale(value: Locale) {
		this.#state.locale = value;
	}

	set uiMode(value: UIMode) {
		this.#state.uiMode = value;
	}

	set boardSize(value: BoardSize) {
		this.#state.boardSize = value;
	}

	set eventsHeight(value: number) {
		this.#state.boardSize.events = value;
		this.#state.boardSize.tags = 100 - value;
	}

	set tagsHeight(value: number) {
		this.#state.boardSize.tags = value;
		this.#state.boardSize.events = 100 - value;
	}

	set buttonBoards(value: ButtonBoard[]) {
		this.#buttonBoards = value;
	}

	set newButtonBoardFormData(value: NewButtonBoardFormData | null) {
		this.#newButtonBoardFormData = value;
	}
	// endregion
}
