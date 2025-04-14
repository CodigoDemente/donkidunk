<script lang="ts">
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { platform } from '@tauri-apps/plugin-os';
	import Controls from './controls.svelte';
	import Progressbar from './progressbar.svelte';

	type Props = {
		video: string | undefined;
	};

	const { video }: Props = $props();

	let videoPlayer: HTMLVideoElement | null = $state(null);

	let duration: number = $state(0);
	let currentTime: number = $state(0);

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
</script>

<div class="flex flex-col p-5">
	<video id="video-player" class="w-100% h-100%" bind:currentTime bind:duration></video>
	{#if videoPlayer}
		<Controls {videoPlayer} bind:currentTime />
	{/if}
	<Progressbar bind:currentTime {duration} />
</div>
