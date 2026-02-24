<script lang="ts">
	import { getTextColorForBackground } from '../../modules/board/utils/colors';
	import type { Props, MultiselectOption } from './types';

	let {
		options = [],
		selectedValues = $bindable([]),
		id = '',
		disabled = false,
		selectClass = '',
		size = 'medium',
		defaultChipColor = '#6366f1',
		maxChips = undefined,
		onSelectionChange = undefined
	}: Props = $props();

	const sizeToClass = {
		mini: 'w-18',
		small: 'w-28',
		medium: 'w-46',
		large: 'w-72',
		full: 'w-full'
	};

	const toggleOption = (optionValue: string | number) => {
		if (disabled) return;

		if (selectedValues.includes(optionValue)) {
			// Deselect option
			selectedValues = selectedValues.filter((value) => value !== optionValue);
		} else {
			// Select option (if maximum not reached)
			if (!maxChips || selectedValues.length < maxChips) {
				selectedValues = [...selectedValues, optionValue];
			}
		}

		if (onSelectionChange) {
			onSelectionChange(selectedValues);
		}
	};

	const isOptionSelected = (optionValue: string | number) => {
		return selectedValues.includes(optionValue);
	};

	const getTagColor = (option: MultiselectOption) => {
		return option.color || defaultChipColor;
	};
</script>

<div
	class={`max-h-58 w-full overflow-y-auto rounded border border-gray-600 bg-gray-700 p-2 ${sizeToClass[size]} ${selectClass} ${
		disabled ? 'cursor-not-allowed opacity-50' : ''
	}`}
	{id}
>
	<div class="flex flex-wrap gap-2">
		{#each options as option (option.id)}
			{@const isSelected = isOptionSelected(option.value)}
			{@const tagColor = getTagColor(option)}
			{@const textColor = getTextColorForBackground(tagColor)}
			<button
				type="button"
				class={`inline-flex items-center rounded-xl px-2 py-1 text-sm font-medium transition-all ${
					isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-700' : 'opacity-50'
				} ${!disabled && 'hover:cursor-pointer hover:brightness-110'}`}
				style={`background-color: ${tagColor}; color: ${textColor};`}
				onclick={() => toggleOption(option.value)}
				{disabled}
				aria-pressed={isSelected}
				aria-label="{option.label} - {isSelected ? 'Selected' : 'Not selected'}"
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>
