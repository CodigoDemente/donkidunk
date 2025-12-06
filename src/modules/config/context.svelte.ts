import { Context } from 'runed';
import { Locale, UIMode, type ConfigData } from './types/Config';
import type { ButtonBoard } from './types/ButtonBoard';

const initialState: ConfigData = {
	locale: Locale.EN,
	uiMode: UIMode.Simple
};

export const configContext = new Context<Config>('');

export class Config {
	#state = $state<ConfigData>(initialState);
	#buttonBoards = $state<ButtonBoard[]>([]);

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

	get buttonBoards() {
		return this.#buttonBoards;
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

	// endregion
}
