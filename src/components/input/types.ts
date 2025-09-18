import type { FullAutoFill } from 'svelte/elements';

export type InputSizes = 'mini' | 'small' | 'medium' | 'large' | 'full';

export interface InputProps {
	label?: string;
	value: string;
	type?: string;
	placeholder?: string;
	name?: string;
	id?: string;
	disabled?: boolean;
	autocomplete?: FullAutoFill;
	readonly?: boolean;
	minlength?: number;
	maxlength?: number;
	required?: boolean;
	inputClass?: string;
	labelClass?: string;
	error?: string;
	size?: InputSizes;
	horizontal?: boolean;
	noErrors?: boolean;
}
