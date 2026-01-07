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
	import { speedOptions } from './utils/controlsUtils';

	type Props = {
		skip: (type: SkipType, direction: SkipDirection) => void;
		play: () => void;
		isPlaying: boolean;
		playbackSpeed?: number;
		onSpeedChange?: (speed: number) => void;
	};

	let { skip, play, isPlaying, playbackSpeed = 1.0, onSpeedChange }: Props = $props();

	let selectedSpeed = $state(playbackSpeed);

	$effect(() => {
		selectedSpeed = playbackSpeed;
	});

	$effect(() => {
		if (onSpeedChange) {
			onSpeedChange(selectedSpeed);
		}
	});
</script>

<div class="mt-2 flex w-full items-center justify-between gap-3">
	<!-- Spacer to center the controls -->
	<div class="flex-1"></div>

	<!-- Centered controls -->
	<div class="flex items-center justify-center gap-3">
		<button
			class="mr-1 hover:cursor-pointer hover:text-white active:text-white"
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
			class="hover:cursor-pointer hover:text-white active:text-white"
			onclick={play}
			aria-label="Play/Pause"
			title="Play/Pause"
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
			class="ml-1 hover:cursor-pointer hover:text-white active:text-white"
			aria-label="Skip Forward Long"
			title="Skip Forward Long"
			onclick={() => skip(SkipType.LONG, SkipDirection.FORWARD)}
		>
			<IconPlayerTrackNext />
		</button>
	</div>

	<!-- Dropdown aligned to the right -->
	<div class="flex flex-1 justify-end">
		{#if onSpeedChange}
			<Dropdown
				options={speedOptions}
				bind:value={selectedSpeed}
				size="mini"
				selectClass="bg-gray-800 !text-gray-200 hover:!bg-gray-700 !w-10 hover:cursor-pointer"
				noErrors
			/>
		{/if}
	</div>
</div>
