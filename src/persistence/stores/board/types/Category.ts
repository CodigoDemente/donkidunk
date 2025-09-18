import type { Button } from './Button';

export interface Category {
	id?: number;
	name: string;
	color: string;
	position: { x: number; y: number };
	buttons: Button[];
}
