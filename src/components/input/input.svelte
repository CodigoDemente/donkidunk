<script lang="ts">
	import type { InputProps } from './types';

	let {
		label = '',
		value = $bindable(),
		type = 'text',
		placeholder = '',
		name = '',
		id = '',
		required = false,
		disabled = false,
		autocomplete = 'off',
		readonly = false,
		minlength = undefined,
		maxlength = undefined,
		inputClass = '',
		labelClass = '',
		error = '',
		size = 'medium',
		horizontal = false,
		noErrors = false
	}: InputProps = $props();

	const sizeToClass = {
		mini: 'w-18',
		small: 'w-28',
		medium: 'w-46',
		large: 'w-72',
		full: 'w-full'
	};
</script>

<label
	class={`${sizeToClass[size]} flex ${horizontal ? 'flex-row items-end' : 'flex-col items-start gap-2'} text-xs text-gray-200 ${labelClass}`}
>
	{#if label}
		<p class={`${horizontal ? ' w-[130px]' : ''}`}>{label}</p>
	{/if}
	<div class="flex w-full {!noErrors && `h-[48px]`} flex-col">
		<input
			{id}
			class={`w-full rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder:text-xs placeholder:text-gray-400 ${inputClass}`}
			bind:value
			{type}
			{placeholder}
			{name}
			{required}
			{disabled}
			{autocomplete}
			{readonly}
			{minlength}
			{maxlength}
		/>
		{#if error}
			<p class="mt-1 w-full text-xs text-red-400">{error}</p>
		{/if}
	</div>
</label>
