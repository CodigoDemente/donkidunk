export enum ButtonRange {
	FIXED = 'FIXED',
	DYNAMIC = 'DYNAMIC'
}

export interface Button {
	id: string;
	color: string;
	name: string;
	range?: ButtonRange;
	duration: number | null;
	before: number | null;
}
