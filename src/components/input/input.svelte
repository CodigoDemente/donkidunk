<script lang="ts">
	import type { InputSizes } from './types';

	export let label: string = '';
	export let value: string = '';
	export let type: string = 'text';
	export let placeholder: string = '';
	export let name: string = '';
	export let id: string = '';
	export let required: boolean = false;
	export let disabled: boolean = false;
	export let autocomplete: string = 'off';
	export let readonly: boolean = false;
	export let minlength: number | undefined = undefined;
	export let maxlength: number | undefined = undefined;
	export let step: string | number = '';
	export let pattern: string = '';
	export let inputClass: string = '';
	export let labelClass: string = '';
	export let error: string = '';
	export let size: InputSizes = 'medium';
	export let horizontal: boolean = false;
	export let onInput: (e: Event) => void = () => {};
	export let noErrors: boolean = false; // If passed no fixed space for errors will be reserved

	const sizeToClass = {
		mini: 'w-18',
		small: 'w-28',
		medium: 'w-46',
		large: 'w-72',
		full: 'w-full'
	};
</script>

<label
	class={`flex ${horizontal ? 'flex-row items-start' : 'flex-col items-start gap-2'} text-sm text-white ${labelClass}`}
>
	{#if label}
		<p class={`text-sm ${horizontal ? ' w-[130px]' : ''}`}>{label}</p>
	{/if}
	<div class="flex {!noErrors && `h-[48px]`} w-full flex-col">
		<input
			{id}
			class={`rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder:text-xs placeholder:text-gray-400 ${sizeToClass[size]} ${inputClass}`}
			bind:value
			{type}
			{placeholder}
			{name}
			{required}
			{disabled}
			autocomplete={autocomplete as any}
			{readonly}
			{minlength}
			{maxlength}
			{step}
			{pattern}
			on:input={onInput}
		/>
		{#if error}
			<p class="mt-1 w-full text-xs text-red-400">{error}</p>
		{/if}
	</div>
</label>
