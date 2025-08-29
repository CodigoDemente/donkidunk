<script lang="ts">
	export let onClick: () => void;
	export let size: 'mini' | 'small' | 'medium' | 'large' | 'extralarge' | 'fluid' = 'medium';
	export let style: string | undefined = undefined;
	export let primary: boolean = false;
	export let tertiary: boolean = false;
	export let customClass: string | undefined = undefined;
	export let disabled: boolean = false;

	const sizeToWidth = {
		mini: 'w-6',
		small: 'w-24',
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

	const bgColor = primary ? 'bg-primary' : tertiary ? 'bg-tertiary' : 'bg-secondary';
	const hoverBgColor = primary
		? 'hover:bg-[var(--color-primary-dark)]'
		: tertiary
			? 'hover:bg-[var(--color-tertiary-dark)]'
			: 'hover:bg-[var(--color-secondary-dark)]';
	const textColor = primary || tertiary ? 'text-supportWhite' : 'text-supportBlack';
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
	${size !== 'mini' ? 'p-1' : ''}
	flex
	items-center
    justify-center
	rounded-[4px]
	${disabled ? 'cursor-not-allowed opacity-70' : ''}
	transition`}
	on:click={onClick}
>
	<slot />
</button>
