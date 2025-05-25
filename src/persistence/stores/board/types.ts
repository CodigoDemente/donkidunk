export interface Category {
	id: string;
	name: string;
	color: string;
	onGrid: number[];
	buttons: Action[];
}

export interface Action {
	id: string;
	name: string;
}

export interface Tag {
	id: string;
	name: string;
	color: string;
}
