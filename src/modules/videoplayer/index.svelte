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

	let progress: number = $derived((timeline.currentTime / timeline.duration) * 100);

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
		}
	});

	// Component handlers
	function handleDragStart(event: DragEvent) {
		var img = new Image();
		img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
		event.dataTransfer?.setDragImage(img, 0, 0);
	}

	function handleDragEnd(event: DragEvent) {
		event.preventDefault();
	}

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
		let skipAmount: number = 1; // 0.1 seconds

		if (type === SkipType.LONG) {
			skipAmount = 2; // 2 seconds
		}

		if (direction === SkipDirection.BACKWARD) {
			skipAmount *= -1;
		}

		timeline.currentTime += skipAmount;
	}
</script>

<div class="flex h-screen flex-col bg-gray-900 p-2">
	<p class="mb-2 inline-block py-1 text-xs">Video / Timeline</p>
	<video
		id="video-player"
		class="max-h-[60vh] w-full"
		bind:currentTime={timeline.currentTime}
		bind:duration={timeline.duration}
	></video>
	{#if videoPlayer}
		<Controls isPlaying={videoIsPlaying} {skip} {play} />
	{/if}
	<Timeline
		bind:currentTime={timeline.currentTime}
		duration={timeline.duration}
		{toTimeString}
		{handleDragStart}
		{handleDragEnd}
		bind:progress
		isPlaying={videoIsPlaying}
	/>
</div>
