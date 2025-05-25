<script lang="ts">
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { platform } from '@tauri-apps/plugin-os';
	import Controls from './controls.svelte';
	import Progressbar from './progressbar.svelte';
	import { SkipDirection, SkipType } from './+types';

	type Props = {
		video: string | undefined;
	};

	export function getCurrentTime() {
		return currentTime;
	}

	const { video }: Props = $props();

	let videoPlayer: HTMLVideoElement | null = $state(null);
	let videoIsPlaying: boolean = $state(false);

	let duration: number = $state(0);
	let currentTime: number = $state(0);
	let progress: number = $derived((currentTime / duration) * 100);

	// Effects

	$effect(() => {
		if (video) {
			videoPlayer = document.getElementById('video-player') as HTMLVideoElement;
			let videoUrl = convertFileSrc(video);

			if (platform() === 'linux') {
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
			videoPlayer.onplay = (event) => {
				console.log(event);
				videoIsPlaying = true;
			};

			videoPlayer.onpause = (event) => {
				console.log(event);
				videoIsPlaying = false;
			};
		}
	});

	// Component handlers

	// Progress bar

	function handleProgressClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const target = event.target as HTMLElement;

		// If not a button, the user clicked the time marker
		if (target.nodeName !== 'BUTTON') {
			return;
		}

		const fullWidth = target.offsetWidth;

		if (event.offsetX < 0 || event.offsetX > fullWidth) {
			return;
		}

		const horizontalPosition = event.offsetX;

		const percentage = horizontalPosition / fullWidth;

		currentTime = percentage * duration;
	}

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
		if (videoPlayer) {
			if (!videoIsPlaying) {
				videoPlayer.play();
			} else {
				videoPlayer.pause();
			}
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
</script>

<div class="flex h-screen flex-col bg-gray-900 p-2">
	<p class="mb-2 inline-block py-1 text-xs">Video / Timeline</p>
	<video id="video-player" class="w-100% h-100%" bind:currentTime bind:duration></video>
	{#if videoPlayer}
		<Controls isPlaying={videoIsPlaying} {skip} {play} />
	{/if}
	<Progressbar
		bind:currentTime
		{duration}
		{toTimeString}
		{handleDragStart}
		{handleDragEnd}
		{handleProgressClick}
		bind:progress
	/>
</div>
