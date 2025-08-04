import type { Action } from './Action';

export interface Category {
	id: number;
	name: string;
	color: string;
	onGrid: number[];
	buttons: Action[];
}
