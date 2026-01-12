<script lang="ts">
	import type { Props } from './types';

	let {
		onClick = () => {},
		size = 'medium',
		style = undefined,
		primary = false,
		tertiary = false,
		customClass = undefined,
		disabled = false,
		children
	}: Props = $props();

	const sizeToWidth = {
		mini: 'w-6',
		small: 'w-18 h-auto',
		medium: 'w-32',
		large: 'w-40',
		extralarge: 'w-48',
		fluid: 'w-full'
	};

	const sizeToText = {
		mini: 'text-sm',
		small: 'text-sm',
		medium: 'text-base',
		large: 'text-lg',
		extralarge: 'text-xl',
		fluid: 'text-base'
	};

	const bgColor = $derived(primary ? 'bg-primary' : tertiary ? 'bg-tertiary' : 'bg-secondary');
	const hoverBgColor = $derived(
		primary
			? 'hover:bg-[var(--color-primary-dark)]'
			: tertiary
				? 'hover:bg-[var(--color-tertiary-dark)]'
				: 'hover:bg-[var(--color-secondary-dark)]'
	);
	const textColor = $derived(primary || tertiary ? 'text-supportWhite' : 'text-supportBlack');
</script>

<button
	{style}
	class={`
	${bgColor}
	${hoverBgColor}
	${customClass}
    ${textColor}
    ${sizeToWidth[size]}
    ${sizeToText[size]}
	${size !== 'mini' ? 'p-2 pb-1' : ''}
	flex
	items-center
	justify-center
    rounded-[4px]
	leading-none
	${!disabled ? 'hover:cursor-pointer' : ''}
	${disabled ? 'cursor-not-allowed opacity-70' : ''}
	transition`}
	{disabled}
	onclick={onClick}
>
	{@render children()}
</button>
