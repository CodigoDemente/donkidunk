import { Context } from 'runed';
import { Locale, UIMode, type ConfigData } from './types/Config';

const initialState: ConfigData = {
	locale: Locale.EN,
	uiMode: UIMode.Simple
};

export const configContext = new Context<Config>('');

export class Config {
	#state = $state<ConfigData>(initialState);

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

	// endregion
}
