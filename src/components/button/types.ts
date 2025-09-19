import type { Snippet } from 'svelte';

export type ButtonSizes = 'mini' | 'small' | 'medium' | 'large' | 'extralarge' | 'fluid';

export interface Props {
	onClick?: () => void;
	size?: ButtonSizes;
	style?: string;
	primary?: boolean;
	tertiary?: boolean;
	customClass?: string;
	disabled?: boolean;
	children: Snippet;
}
