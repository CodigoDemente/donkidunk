<script lang="ts">
	import {
		IconPlayerPlay,
		IconPlayerPause,
		IconPlayerSkipForward,
		IconPlayerSkipBack
	} from '@tabler/icons-svelte';
	import { SkipDirection } from './types/SkipDirection';
	import { SkipType } from './types/SkipType';

	type Props = {
		skip: (type: SkipType, direction: SkipDirection) => void;
		play: () => void;
		isPlaying: boolean;
	};

	let { skip, play, isPlaying }: Props = $props();
</script>

<div class="flex flex-row justify-center">
	<button
		class="p-2 pb-0 hover:text-white active:text-white"
		aria-label="Rewind Slow"
		title="Rewind Slow"
		onclick={() => skip(SkipType.SHORT, SkipDirection.BACKWARD)}
	>
		<IconPlayerSkipBack />
	</button>
	<button
		class="p-2 pb-0 hover:text-white active:text-white"
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
		class="p-2 pb-0 hover:text-white active:text-white"
		aria-label="Rewind"
		title="Rewind"
		onclick={() => skip(SkipType.SHORT, SkipDirection.FORWARD)}
	>
		<IconPlayerSkipForward />
	</button>
</div>
