<script lang="ts">
	import Timeline from './timeline.svelte';
	import Controls from './controls.svelte';
	import Video from './video.svelte';
	import { SkipType } from './types/SkipType';
	import { SkipDirection } from './types/SkipDirection';
	import { timelineContext } from './context.svelte';

	type Props = {
		video: string | undefined;
	};

	const timeline = timelineContext.get();

	const { video }: Props = $props();

	let playbackSpeed = $state<number>(1.0);
	let skipStep = $state<number>(15);
	let highlightedSkip: 'forward' | 'backward' | 'play' | null = $state(null);
	let videoPlayerRef: HTMLVideoElement | null = $state(null);

	let progress: number = $derived((timeline.currentTime / timeline.duration) * 100);

	/* ==================== UTILITY FUNCTIONS ==================== */

	function toZeroPad(num: number) {
		return ('00' + num).slice(-2);
	}

	function toTimeString(num: number) {
		const hours = Math.floor(num / 3600);
		const minutes = Math.floor((num % 3600) / 60);
		const seconds = Math.floor(num % 60);

		return `${toZeroPad(hours)}:${toZeroPad(minutes)}:${toZeroPad(seconds)}`;
	}

	/* ==================== VIDEO CONTROL HANDLERS ==================== */

	function play() {
		if (!videoPlayerRef) return;

		if (!timeline.isPlaying) {
			videoPlayerRef.play();
		} else {
			videoPlayerRef.pause();
		}
	}

	function skip(type: SkipType, direction: SkipDirection) {
		let skipAmount: number = 1;

		if (type === SkipType.LONG) {
			skipAmount = skipStep;
		}

		if (direction === SkipDirection.BACKWARD) {
			skipAmount *= -1;
		}

		timeline.currentTime += skipAmount;
	}

	function setPlaybackSpeed(speed: number) {
		playbackSpeed = speed;
	}

	function setSkipStep(step: number) {
		skipStep = step;
	}
</script>

<div
	class="flex h-full flex-col overflow-x-hidden overflow-y-hidden rounded-md border border-gray-700 bg-gray-800 px-2"
>
	<p
		class="mb-2 inline-block border-b border-gray-700 px-2 py-1 text-xs font-semibold text-gray-200"
	>
		Video / Timeline
	</p>

	<Video
		{video}
		bind:currentTime={timeline.currentTime}
		bind:duration={timeline.duration}
		{playbackSpeed}
		onPlayStateChange={(isPlaying) => {
			timeline.isPlaying = isPlaying;
		}}
		onSkip={skip}
		onPlay={play}
		onHighlightChange={(highlight) => {
			highlightedSkip = highlight;
		}}
		bind:videoPlayerRef
	/>
	{#if video && videoPlayerRef}
		<Controls
			isPlaying={timeline.isPlaying}
			{skip}
			{play}
			{playbackSpeed}
			onSpeedChange={setPlaybackSpeed}
			{skipStep}
			onSkipStepChange={setSkipStep}
			{highlightedSkip}
		/>
		<Timeline
			bind:currentTime={timeline.currentTime}
			duration={timeline.duration}
			{toTimeString}
			bind:progress
			isPlaying={timeline.isPlaying}
		/>
	{/if}
</div>
