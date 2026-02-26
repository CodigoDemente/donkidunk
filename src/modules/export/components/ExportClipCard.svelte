<script lang="ts">
	import { IconPlayerPlay, IconPlayerPause, IconArrowsMaximize } from '@tabler/icons-svelte';
	import type { ExportClip } from '../types';

	interface Props {
		clip: ExportClip;
		videoSrc: string;
		ondragstart?: (e: DragEvent) => void;
		onExpand?: (clip: ExportClip) => void;
	}

	let { clip, videoSrc, ondragstart, onExpand }: Props = $props();

	let videoEl: HTMLVideoElement | null = $state(null);
	let isPlaying = $state(false);
	let timeUpdateHandler: ((e: Event) => void) | null = null;

	const thumbnailSrc = $derived(`${videoSrc}#t=${clip.startTime}`);

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function togglePlay(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		if (!videoEl) return;

		if (isPlaying) {
			videoEl.pause();
			isPlaying = false;
			return;
		}

		videoEl.src = videoSrc;
		videoEl.currentTime = clip.startTime;

		timeUpdateHandler = () => {
			if (videoEl && videoEl.currentTime >= clip.endTime) {
				videoEl.pause();
				videoEl.src = thumbnailSrc;
				isPlaying = false;
			}
		};
		videoEl.addEventListener('timeupdate', timeUpdateHandler);

		videoEl.play();
		isPlaying = true;
	}

	function handleExpand(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		if (videoEl) {
			videoEl.pause();
			if (timeUpdateHandler) {
				videoEl.removeEventListener('timeupdate', timeUpdateHandler);
			}
			videoEl.src = thumbnailSrc;
			isPlaying = false;
		}
		onExpand?.(clip);
	}
</script>

<div
	class="group/card w-full cursor-grab overflow-hidden rounded-lg border border-gray-600 bg-gray-800 transition-colors hover:border-gray-500 active:cursor-grabbing"
	draggable="true"
	{ondragstart}
	role="listitem"
>
	<!-- Video area -->
	<div class="relative aspect-video w-full overflow-hidden bg-black">
		<video
			bind:this={videoEl}
			src={thumbnailSrc}
			class="h-full w-full object-contain"
			preload="metadata"
			muted
		></video>

		<!-- Play/Pause overlay -->
		<button
			class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100 {isPlaying
				? 'bg-transparent! opacity-100'
				: ''}"
			onclick={togglePlay}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-110"
			>
				{#if isPlaying}
					<IconPlayerPause size={20} />
				{:else}
					<IconPlayerPlay size={20} />
				{/if}
			</div>
		</button>

		<!-- Expand icon (only while playing) -->
		{#if isPlaying}
			<button
				class="absolute right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-black/80"
				onclick={handleExpand}
				title="Expand video"
			>
				<IconArrowsMaximize size={14} />
			</button>
		{/if}
	</div>

	<!-- Info area -->
	<div class="flex flex-col gap-1 p-2">
		<p class="truncate text-sm font-semibold text-gray-200">{clip.title}</p>
		<p class="text-xs text-gray-400">{clip.categoryName}</p>
		<p class="text-xs text-gray-500">
			{formatTime(clip.startTime)} - {formatTime(clip.endTime)}
		</p>
		{#if clip.tags.length > 0}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each clip.tags as tag (tag.id)}
					<span
						class="rounded px-1.5 py-0.5 text-[10px] font-medium"
						style="background-color: {tag.color}20; color: {tag.color};"
					>
						{tag.name}
					</span>
				{/each}
			</div>
		{/if}
	</div>
</div>
