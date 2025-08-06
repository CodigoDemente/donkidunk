import type { Action } from './Action';

export interface Category {
	id: number;
	name: string;
	color: string;
	position: { x: number; y: number };
	buttons: Action[];
}
