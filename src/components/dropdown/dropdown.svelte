<script lang="ts">
	import { IconChevronDown } from '@tabler/icons-svelte';
	import type { Props } from './types';

	let {
		label = '',
		options = [],
		value = $bindable(''),
		name = '',
		id = '',
		disabled = false,
		labelClass = '',
		selectClass = '',
		error = '',
		size = 'medium',
		horizontal = false,
		placeholder = undefined,
		noErrors = false
	}: Props = $props();

	const sizeToClass = {
		mini: 'w-18',
		small: 'w-28',
		medium: 'w-46',
		large: 'w-72',
		full: 'w-full'
	};

	let open = $state(false);

	const onChange = (val: string | number) => {
		value = val as string;
		open = false;
	};
</script>

<label
	class={`flex ${horizontal ? 'flex-row items-start' : 'flex-col items-start gap-2'} text-sm text-white ${labelClass}`}
>
	{#if label}
		<p class={`text-sm ${horizontal ? ' w-[130px]' : ''}`}>{label}</p>
	{/if}
	<div class="relative flex {!noErrors && `h-[48px]`} w-full flex-col">
		<button
			type="button"
			class={`h-[26px] rounded border-0 bg-gray-700 px-2 py-1 text-left text-sm text-white ${sizeToClass[size]} ${selectClass} flex items-center justify-between transition-all
              ${open ? 'ring-2 ring-violet-700' : ''} disabled:cursor-not-allowed disabled:opacity-50
            `}
			onclick={() => (open = !open)}
			{disabled}
			tabindex="0"
			aria-haspopup="listbox"
			aria-expanded={open}
			{id}
			{name}
		>
			<span class={value ? 'leading-4' : 'w-full text-xs text-gray-400'}>
				{options.find((o) => o.value === value)?.label ?? placeholder}
			</span>
			<IconChevronDown
				class="ml-auto p-1 transition-transform duration-200"
				style="transform: {open ? 'rotate(180deg)' : 'rotate(0deg)'}"
			/>
		</button>
		{#if error}
			<p class="mt-1 w-full text-xs text-red-400">{error}</p>
		{/if}
		{#if open}
			<ul
				class={`absolute top-[26px] left-0 z-10 mt-1 max-h-26 overflow-auto rounded border border-gray-700 bg-gray-800 shadow ${sizeToClass[size]}`}
				role="listbox"
			>
				{#each options as opt (opt.value)}
					<li
						class="cursor-pointer px-2 py-1 text-white hover:bg-gray-600"
						role="option"
						aria-selected={opt.value === value}
						onmousedown={(event) => (event.preventDefault(), onChange(opt.value))}
					>
						{opt.label}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</label>
