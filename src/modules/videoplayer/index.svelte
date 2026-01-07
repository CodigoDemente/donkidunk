<script lang="ts">
	import Timeline from './timeline.svelte';
	import Controls from './controls.svelte';
	import { SkipType } from './types/SkipType';
	import { SkipDirection } from './types/SkipDirection';
	import { timelineContext } from './context.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { platform } from '@tauri-apps/plugin-os';

	type Props = {
		video: string | undefined;
	};

	const timeline = timelineContext.get();

	const { video }: Props = $props();

	let videoPlayer: HTMLVideoElement | null = $state(null);
	let videoIsPlaying: boolean = $state(false);
	let playbackSpeed = $state<number>(1.0);

	let progress: number = $derived((timeline.currentTime / timeline.duration) * 100);

	// Trackpad gesture state for smooth scrolling
	let trackpadDeltaX = $state(0);
	let trackpadTimeout: ReturnType<typeof setTimeout> | null = null;

	// Effects

	$effect(() => {
		if (video) {
			videoPlayer = document.getElementById('video-player') as HTMLVideoElement;
			let videoUrl = convertFileSrc(video);

			if (platform() !== 'windows') {
				videoUrl = 'http://localhost:16780/?file=' + encodeURIComponent(video);
			}

			const source = document.createElement('source');
			source.type = 'video/mp4';
			source.src = videoUrl;

			if (videoPlayer.firstChild) {
				videoPlayer.removeChild(videoPlayer.firstChild);
			}

			videoPlayer.appendChild(source);
			videoPlayer.load();
			videoPlayer.currentTime = 0.1;
		}
	});

	$effect(() => {
		if (videoPlayer) {
			videoPlayer.onplay = () => {
				videoIsPlaying = true;
			};

			videoPlayer.onpause = () => {
				videoIsPlaying = false;
			};

			videoPlayer.playbackRate = playbackSpeed;
		}
	});

	// Component handlers

	function toZeroPad(num: number) {
		return ('00' + num).slice(-2);
	}

	function toTimeString(num: number) {
		const hours = Math.floor(num / 3600);
		const minutes = Math.floor((num % 3600) / 60);
		const seconds = Math.floor(num % 60);

		return `${toZeroPad(hours)}:${toZeroPad(minutes)}:${toZeroPad(seconds)}`;
	}

	// Controls

	function play() {
		if (!videoIsPlaying) {
			videoPlayer?.play();
		} else {
			videoPlayer?.pause();
		}
	}

	function skip(type: SkipType, direction: SkipDirection) {
		let skipAmount: number = 1;

		if (type === SkipType.LONG) {
			skipAmount = 15;
		}

		if (direction === SkipDirection.BACKWARD) {
			skipAmount *= -1;
		}

		timeline.currentTime += skipAmount;
	}

	function setPlaybackSpeed(speed: number) {
		playbackSpeed = speed;
	}

	// Handle trackpad horizontal gestures for skip forward/backward
	function handleTrackpadGesture(event: WheelEvent) {
		if (event.ctrlKey || event.metaKey) return;

		// Check if it's a horizontal gesture (deltaX is significant)
		if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
			event.preventDefault();
			event.stopPropagation();

			// Accumulate deltaX for smoother scrolling
			trackpadDeltaX += event.deltaX;

			// Clear existing timeout
			if (trackpadTimeout) {
				clearTimeout(trackpadTimeout);
			}

			// Threshold for triggering skip (accumulated movement)
			const skipThreshold = 50; // Pixels of accumulated movement

			// If accumulated movement exceeds threshold, perform skip
			if (Math.abs(trackpadDeltaX) >= skipThreshold) {
				const direction = trackpadDeltaX < 0 ? SkipDirection.FORWARD : SkipDirection.BACKWARD;
				skip(SkipType.SHORT, direction);
				trackpadDeltaX = 0; // Reset accumulator
			}

			// Reset accumulator after a short delay (when gesture ends)
			trackpadTimeout = setTimeout(() => {
				trackpadDeltaX = 0;
				trackpadTimeout = null;
			}, 150);
		}
	}
</script>

<div
	class="flex h-full flex-col overflow-x-hidden overflow-y-hidden rounded-md border border-gray-700 bg-gray-800 px-2"
>
	{#if videoPlayer}
		<p
			class="mb-2 inline-block border-b border-gray-700 px-2 py-1 text-xs font-semibold text-gray-200"
		>
			Video / Timeline
		</p>
	{/if}
	<video
		id="video-player"
		class={{
			'max-h-[50vh]': true,
			'w-full': true,
			'bg-black': !!videoPlayer
		}}
		bind:currentTime={timeline.currentTime}
		bind:duration={timeline.duration}
		onwheel={handleTrackpadGesture}
	></video>
	{#if videoPlayer}
		<Controls
			isPlaying={videoIsPlaying}
			{skip}
			{play}
			{playbackSpeed}
			onSpeedChange={setPlaybackSpeed}
		/>
		<Timeline
			bind:currentTime={timeline.currentTime}
			duration={timeline.duration}
			{toTimeString}
			bind:progress
			isPlaying={videoIsPlaying}
		/>
	{/if}
</div>
