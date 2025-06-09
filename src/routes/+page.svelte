<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import Board from '../modules/board/index.svelte';
	import VideoPlayer from '../modules/videoplayer/index.svelte';
	import ProjectStore from '../stores/project.svelte';
	import '../styles/page.css';

	type VideoPlayerComponent = SvelteComponent & {
		getCurrentTime: () => number;
	};

	let videoPlayerRef: VideoPlayerComponent | null = null;
	let leftWidth = 50;
	let isResizing = false;

	function handleCheckTime() {
		return videoPlayerRef?.getCurrentTime() ?? 0;
	}

	function startResize() {
		isResizing = true;
		document.addEventListener('mousemove', resize);
		document.addEventListener('mouseup', stopResize);
	}

	function resize(event: MouseEvent) {
		if (isResizing) {
			const totalWidth = window.innerWidth;
			leftWidth = Math.min(70, Math.max(20, (event.clientX / totalWidth) * 100)); // Clamp between 20% and 80%
		}
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', resize);
		document.removeEventListener('mouseup', stopResize);
	}
</script>

<div class="flex w-full flex-row gap-1">
	<div class="flex-shrink-0" style="width: {leftWidth}%">
		<VideoPlayer video={ProjectStore.getProject().video?.path} bind:this={videoPlayerRef} />
	</div>
	<div class="w-1 cursor-col-resize bg-gray-900" on:mousedown={startResize}></div>
	<div class="flex-grow">
		<Board checkTime={handleCheckTime} />
	</div>
</div>
