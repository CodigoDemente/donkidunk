<script lang="ts">
	import { convertFileSrc } from '@tauri-apps/api/core';

	type Props = {
		video: string | undefined;
	};

	const { video }: Props = $props();

	$effect(() => {
		if (video) {
			const videoPlayer = document.getElementById('video-player') as HTMLVideoElement;
			const videoUrl = convertFileSrc(video);

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

<section id="video-player-container">
	<video id="video-player" controls muted style="width: 100%; height: 100%;"> </video>
</section>
