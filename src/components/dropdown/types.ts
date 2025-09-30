import type { InputSizes } from '../input/types';

export interface Props {
	label?: string;
	options?: { value: string | number | null; label: string }[];
	value?: string | number | null;
	name?: string;
	id?: string;
	disabled?: boolean;
	labelClass?: string;
	selectClass?: string;
	error?: string;
	size?: InputSizes;
	horizontal?: boolean;
	placeholder?: string;
	noErrors?: boolean;
}
