<script lang="ts">
	import { IconChevronDown, IconX } from '@tabler/icons-svelte';
	import type { Props, MultiselectOption } from './types';

	let {
		label = '',
		options = [],
		selectedValues = $bindable([]),
		name = '',
		id = '',
		disabled = false,
		labelClass = '',
		selectClass = '',
		chipClass = '',
		error = '',
		size = 'medium',
		horizontal = false,
		placeholder = 'Seleccionar opciones...',
		noErrors = false,
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

	let open = $state(false);

	const selectedOptions = $derived(
		options.filter((option) => selectedValues.includes(option.value))
	);

	const availableOptions = $derived(
		options.filter((option) => !selectedValues.includes(option.value))
	);

	const toggleOption = (optionValue: string | number) => {
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

		// Don't auto-close dropdown to allow multiple selections
	};

	const removeChip = (optionValue: string | number) => {
		selectedValues = selectedValues.filter((value) => value !== optionValue);

		if (onSelectionChange) {
			onSelectionChange(selectedValues);
		}
	};

	const getChipColor = (option: MultiselectOption) => {
		return option.color || defaultChipColor;
	};

	const isOptionSelected = (optionValue: string | number) => {
		return selectedValues.includes(optionValue);
	};
</script>

<label
	class={`flex ${horizontal ? 'flex-row items-start' : 'flex-col items-start gap-2'} text-sm text-white ${labelClass}`}
>
	{#if label}
		<p class={`text-sm ${horizontal ? ' w-[130px]' : ''}`}>{label}</p>
	{/if}
	<div class="relative flex {!noErrors && `h-auto min-h-[48px]`} w-full flex-col">
		<button
			type="button"
			class={`min-h-[26px] rounded border-0 bg-gray-700 px-2 py-1 text-left text-sm text-white ${sizeToClass[size]} ${selectClass} flex flex-col items-stretch transition-all
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
			<!-- Chip and placeholder area -->
			<div class="flex flex-wrap items-center justify-between gap-1">
				<div class="flex flex-wrap gap-1">
					{#if selectedOptions.length === 0}
						<span class="text-xs text-gray-400">{placeholder}</span>
					{:else}
						{#each selectedOptions as option (option.id)}
							<span
								class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white ${chipClass}`}
								style="background-color: {getChipColor(option)}"
							>
								{option.label}
								<span
									class="inline-flex cursor-pointer items-center justify-center rounded-full p-0.5 hover:bg-black/20"
									onclick={(e) => {
										e.stopPropagation();
										removeChip(option.value);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											e.stopPropagation();
											removeChip(option.value);
										}
									}}
									tabindex="0"
									role="button"
									aria-label="Remove {option.label}"
								>
									<IconX size={12} />
								</span>
							</span>
						{/each}
					{/if}
				</div>
				<IconChevronDown
					class="ml-auto flex-shrink-0 p-1 transition-transform duration-200"
					size={16}
					style="transform: {open ? 'rotate(180deg)' : 'rotate(0deg)'}"
				/>
			</div>
		</button>

		{#if error}
			<p class="mt-1 w-full text-xs text-red-400">{error}</p>
		{/if}

		{#if open}
			<ul
				class={`absolute top-full left-0 z-10 mt-1 max-h-48 overflow-auto rounded border border-gray-700 bg-gray-800 shadow ${sizeToClass[size]}`}
				role="listbox"
			>
				{#if availableOptions.length === 0}
					<li class="px-2 py-2 text-xs text-gray-400">
						{maxChips && selectedValues.length >= maxChips
							? `Maximum of ${maxChips} options selected`
							: 'No more options available'}
					</li>
				{:else}
					{#each options as opt (opt.id)}
						<li
							class={`flex cursor-pointer items-center justify-between px-2 py-2 text-white hover:bg-gray-600 ${
								isOptionSelected(opt.value) ? 'bg-gray-600' : ''
							}`}
							role="option"
							aria-selected={isOptionSelected(opt.value)}
							onmousedown={(event) => {
								event.preventDefault();
								toggleOption(opt.value);
							}}
						>
							<span class="flex items-center gap-2">
								{#if opt.color}
									<span
										class="h-3 w-3 flex-shrink-0 rounded-full"
										style="background-color: {opt.color}"
									></span>
								{/if}
								{opt.label}
							</span>
							{#if isOptionSelected(opt.value)}
								<span class="text-xs text-green-400">✓</span>
							{/if}
						</li>
					{/each}
				{/if}
			</ul>
		{/if}
	</div>
</label>
