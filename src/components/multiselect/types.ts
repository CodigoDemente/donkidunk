import type { InputSizes } from '../input/types';

export interface MultiselectOption {
	id: string;
	value: string | number;
	label: string;
	color?: string;
}

export interface Props {
	label?: string;
	options?: MultiselectOption[];
	selectedValues?: (string | number)[];
	name?: string;
	id?: string;
	disabled?: boolean;
	labelClass?: string;
	selectClass?: string;
	chipClass?: string;
	size?: InputSizes;
	horizontal?: boolean;
	placeholder?: string;
	defaultChipColor?: string;
	maxChips?: number;
	onSelectionChange?: (selectedValues: (string | number)[]) => void;
}
