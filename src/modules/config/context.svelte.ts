import { Context } from 'runed';
import { Locale, UIMode, type ConfigData } from './types/Config';
import type { ButtonBoard } from './types/ButtonBoard';
import type { NewButtonBoardFormData } from './types/NewButtonBoardFormData';

const initialState: ConfigData = {
	locale: Locale.EN,
	uiMode: UIMode.Simple
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

	set buttonBoards(value: ButtonBoard[]) {
		this.#buttonBoards = value;
	}

	set newButtonBoardFormData(value: NewButtonBoardFormData | null) {
		this.#newButtonBoardFormData = value;
	}
	// endregion
}
