<script lang="ts">
	export let onClick: () => void;
	export let size: 'mini' | 'small' | 'medium' | 'large' | 'extralarge' | 'fluid' = 'medium';
	export let color: string | null = null;

	const sizeToWidth = {
		mini: 'w-18',
		small: 'w-24',
		medium: 'w-32',
		large: 'w-40',
		extralarge: 'w-48',
		fluid: 'w-full'
	};

	const sizeToText = {
		mini: 'text-xs',
		small: 'text-sm',
		medium: 'text-base',
		large: 'text-lg',
		extralarge: 'text-xl',
		fluid: 'text-base'
	};
</script>

<!-- NOT WORKING VAR -->
<button
	class="flex
    items-center
    justify-center
    rounded-[4px]
    {sizeToWidth[size]} 
    bg-blue-600
    p-1
	{sizeToText[size]}
    text-white
    transition
    hover:bg-blue-500"
	on:click={onClick}
>
	<slot />
</button>
