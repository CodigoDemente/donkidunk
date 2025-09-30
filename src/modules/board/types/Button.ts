export enum ButtonRange {
	FIXED = 'FIXED',
	DYNAMIC = 'DYNAMIC'
}

export interface Button {
	id: number;
	name: string;
	range?: ButtonRange;
	duration: number | null;
	before: number | null;
	temp: boolean;
}
