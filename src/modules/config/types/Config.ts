export enum Locale {
	EN,
	ES
}

export enum UIMode {
	Simple,
	Advanced
}

export interface ConfigData {
	locale: Locale;
	uiMode: UIMode;
}
