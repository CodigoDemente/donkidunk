<script lang="ts">
	import {
		IconPlayerPlay,
		IconPlayerPause,
		IconPlayerSkipForward,
		IconPlayerSkipBack,
		IconPlayerTrackPrev,
		IconPlayerTrackNext
	} from '@tabler/icons-svelte';
	import { SkipDirection } from './types/SkipDirection';
	import { SkipType } from './types/SkipType';
	import Dropdown from '../../components/dropdown/dropdown.svelte';
	import { speedOptions, skipStepOptions } from './utils/controlsUtils';
	import Tooltip from '../../components/tooltip/tooltip.svelte';
	import { boardContext } from '../board/context.svelte';

	type Props = {
		skip: (type: SkipType, direction: SkipDirection) => void;
		play: () => void;
		isPlaying: boolean;
		playbackSpeed?: number;
		onSpeedChange?: (speed: number) => void;
		skipStep?: number;
		onSkipStepChange?: (step: number) => void;
		highlightedSkip?: 'forward' | 'backward' | 'play' | null;
	};

	let {
		skip,
		play,
		isPlaying,
		playbackSpeed = 1.0,
		onSpeedChange,
		skipStep = 15,
		onSkipStepChange,
		highlightedSkip = null
	}: Props = $props();

	const board = boardContext.get();

	let selectedSpeed = $derived(playbackSpeed);
	let selectedSkipStep = $derived(skipStep);

	$effect(() => {
		selectedSpeed = playbackSpeed;
	});

	$effect(() => {
		if (onSpeedChange) {
			onSpeedChange(selectedSpeed);
		}
	});

	$effect(() => {
		selectedSkipStep = skipStep;
	});

	$effect(() => {
		if (onSkipStepChange) {
			onSkipStepChange(selectedSkipStep);
		}
	});

	// Handle Ctrl + V
	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.ctrlKey && e.key === 'v' && onSpeedChange) {
				e.preventDefault();
				const currentIndex = speedOptions.findIndex((opt) => opt.value === selectedSpeed);
				const nextIndex = (currentIndex + 1) % speedOptions.length;
				const nextSpeed = speedOptions[nextIndex].value;
				selectedSpeed = nextSpeed;
				onSpeedChange(nextSpeed);
			}
			if (e.ctrlKey && e.key === 'b' && onSkipStepChange) {
				e.preventDefault();
				const currentIndex = skipStepOptions.findIndex((opt) => opt.value === selectedSkipStep);
				const nextIndex = (currentIndex + 1) % skipStepOptions.length;
				const nextSkipStep = skipStepOptions[nextIndex].value;
				selectedSkipStep = nextSkipStep;
				onSkipStepChange(nextSkipStep);
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div class="mt-2 flex w-full items-center justify-between gap-3">
	<div class="flex-1"></div>

	<div class="flex items-center justify-center gap-3">
		<button
			class="mr-1 transition-all hover:cursor-pointer hover:text-white active:text-white {highlightedSkip ===
			'backward'
				? 'text-tertiary scale-110'
				: ''}"
			aria-label="Rewind Long"
			title="Rewind Long"
			onclick={() => skip(SkipType.LONG, SkipDirection.BACKWARD)}
		>
			<IconPlayerTrackPrev />
		</button>
		<button
			class="hover:cursor-pointer hover:text-white active:text-white"
			aria-label="Rewind Slow"
			title="Rewind Slow"
			onclick={() => skip(SkipType.SHORT, SkipDirection.BACKWARD)}
		>
			<IconPlayerSkipBack />
		</button>
		<button
			class="transition-all hover:text-white active:text-white
			{board.isEditing ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'}
			{highlightedSkip === 'play' ? 'text-tertiary scale-110' : ''}"
			onclick={play}
			aria-label="Play/Pause"
			title="Play/Pause"
			disabled={board.isEditing}
		>
			{#if isPlaying}
				<IconPlayerPause />
			{:else}
				<IconPlayerPlay />
			{/if}
		</button>
		<button
			class="hover:cursor-pointer hover:text-white active:text-white"
			aria-label="Rewind"
			title="Rewind"
			onclick={() => skip(SkipType.SHORT, SkipDirection.FORWARD)}
		>
			<IconPlayerSkipForward />
		</button>
		<button
			class="ml-1 transition-all hover:cursor-pointer hover:text-white active:text-white {highlightedSkip ===
			'forward'
				? 'text-tertiary scale-110'
				: ''}"
			aria-label="Skip Forward Long"
			title="Skip Forward Long"
			onclick={() => skip(SkipType.LONG, SkipDirection.FORWARD)}
		>
			<IconPlayerTrackNext />
		</button>
	</div>

	<div class="flex flex-1 items-center justify-end gap-2">
		{#if onSpeedChange}
			<Tooltip text="Ctrl + V" position="top" size="small">
				<Dropdown
					options={speedOptions}
					bind:value={selectedSpeed}
					size="mini"
					selectClass="bg-gray-800 !text-gray-200 hover:!bg-gray-700 !w-10 hover:cursor-pointer"
					noErrors
				/>
			</Tooltip>
		{/if}
		{#if onSkipStepChange}
			<Tooltip text="Ctrl + B" position="top" size="small">
				<Dropdown
					options={skipStepOptions}
					bind:value={selectedSkipStep}
					size="mini"
					selectClass="bg-gray-800 !text-gray-200 hover:!bg-gray-700 !w-8 hover:cursor-pointer"
					noErrors
				/>
				<IconPlayerTrackNext class="mt-1 h-3 w-3 " />
			</Tooltip>
		{/if}
	</div>
</div>
