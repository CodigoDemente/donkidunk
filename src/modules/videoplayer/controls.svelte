<script lang="ts">
	import {
		IconPlayerPlay,
		IconPlayerPause,
		IconPlayerSkipForward,
		IconPlayerSkipBack
	} from '@tabler/icons-svelte';

	const SkipDirection = {
		BACKWARD: 'backward',
		FORWARD: 'forward'
	} as const;
	type SkipDirection = (typeof SkipDirection)[keyof typeof SkipDirection];

	const SkipType = {
		SHORT: 'short',
		LONG: 'long'
	} as const;
	type SkipType = (typeof SkipType)[keyof typeof SkipType];

	type Props = {
		videoPlayer: HTMLVideoElement;
		currentTime: number;
	};

	type VideoState = {
		playing: boolean;
	};

	let { videoPlayer, currentTime = $bindable() }: Props = $props();

	const videoState: VideoState = $state({
		playing: false
	});

	function play() {
		if (!videoState.playing) {
			videoPlayer.play();
		} else {
			videoPlayer.pause();
		}
	}

	function skip(type: SkipType, direction: SkipDirection) {
		let skipAmount: number = 1; // 0.1 seconds

		if (type === SkipType.LONG) {
			skipAmount = 2; // 2 seconds
		}

		if (direction === SkipDirection.BACKWARD) {
			skipAmount *= -1;
		}

		currentTime += skipAmount;
	}

	videoPlayer.onplay = (event) => {
		console.log(event);
		videoState.playing = true;
	};

	videoPlayer.onpause = (event) => {
		console.log(event);
		videoState.playing = false;
	};
</script>

<div class="flex flex-row justify-center">
	<button
		class="p-2 hover:text-white active:text-white"
		aria-label="Rewind Slow"
		title="Rewind Slow"
		onclick={() => skip(SkipType.SHORT, SkipDirection.BACKWARD)}
	>
		<IconPlayerSkipBack />
	</button>
	<button
		class="p-2 hover:text-white active:text-white"
		onclick={play}
		aria-label="Play/Pause"
		title="Play/Pause"
	>
		{#if videoState.playing}
			<IconPlayerPause />
		{:else}
			<IconPlayerPlay />
		{/if}
	</button>
	<button
		class="p-2 hover:text-white active:text-white"
		aria-label="Rewind"
		title="Rewind"
		onclick={() => skip(SkipType.SHORT, SkipDirection.FORWARD)}
	>
		<IconPlayerSkipForward />
	</button>
</div>
