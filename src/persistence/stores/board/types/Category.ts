import type { Action } from './Action';

export interface Category {
	id: string;
	name: string;
	color: string;
	onGrid: number[];
	buttons: Action[];
}
