export enum Locale {
	EN,
	ES
}

export enum UIMode {
	Simple,
	Advanced
}

export interface BoardSize {
	events: number;
	tags: number;
}

export interface ConfigData {
	locale: Locale;
	uiMode: UIMode;
	boardSize: BoardSize;
}
