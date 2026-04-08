<script lang="ts">
	import { IconArrowsMaximize } from '@tabler/icons-svelte';
	import type { GalleryClip } from '../types';
	import { getTextColorForBackground } from '../../board/utils/colors';
	import Tag from '../../../components/tag/tag.svelte';

	interface Props {
		clip: GalleryClip;
		videoSrc: string;
		ondragstart?: (e: DragEvent) => void;
		onExpand?: (clip: GalleryClip) => void;
	}

	let { clip, videoSrc, ondragstart, onExpand }: Props = $props();

	const thumbnailSrc = $derived(`${videoSrc}#t=${clip.timestamps[0]}`);

	let thumbnailRoot: HTMLDivElement | undefined = $state();
	let shouldLoadThumbnail = $state(false);
	let thumbnailReady = $state(false);

	$effect(() => {
		void thumbnailSrc;
		thumbnailReady = false;
	});

	$effect(() => {
		const el = thumbnailRoot;
		if (!el) return;

		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					shouldLoadThumbnail = true;
					io.disconnect();
				}
			},
			{ root: null, rootMargin: '180px 0px', threshold: 0 }
		);

		io.observe(el);
		return () => io.disconnect();
	});

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function handleClick() {
		onExpand?.(clip);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="group/card w-full cursor-grab overflow-hidden rounded-lg border border-gray-600 bg-gray-800 transition-colors hover:border-gray-500 active:cursor-grabbing"
	draggable="true"
	{ondragstart}
	onclick={handleClick}
	role="listitem"
>
	<!-- Thumbnail area (paused <video> at the clip start, not playable) -->
	<div bind:this={thumbnailRoot} class="relative aspect-video w-full overflow-hidden bg-black">
		{#if !thumbnailReady}
			<div class="absolute inset-0 z-10 animate-pulse bg-gray-900" aria-hidden="true"></div>
		{/if}

		{#if shouldLoadThumbnail}
			<video
				src={thumbnailSrc}
				class="pointer-events-none h-full w-full object-contain transition-opacity duration-200 {thumbnailReady
					? 'opacity-100'
					: 'opacity-0'}"
				preload="metadata"
				muted
				playsinline
				onloadeddata={() => {
					thumbnailReady = true;
				}}
				onerror={() => {
					thumbnailReady = true;
				}}
			></video>
		{/if}

		{#if onExpand}
			<div
				class="absolute inset-0 z-20 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/card:opacity-100"
			>
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
					<IconArrowsMaximize size={20} />
				</div>
			</div>
		{/if}
	</div>

	<!-- Info area -->
	<div class="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
		<div class="flex items-center gap-2">
			<p class="text-tertiary text-sm font-semibold">{clip.index + 1} -</p>
			<p class="text-sm text-gray-200">
				{formatTime(clip.timestamps[0])} - {formatTime(clip.timestamps[1])}
			</p>
		</div>
		<div
			class="w-fit rounded-sm px-2 py-0.5 text-sm font-medium"
			style={`
				background-color: ${clip.buttonColor};
				color: ${getTextColorForBackground(clip.buttonColor)};
				`}
		>
			{clip.buttonName} ({clip.categoryName})
		</div>
		{#if clip.tags.length > 0}
			<div class="mt-1 flex max-h-15 flex-wrap gap-1">
				{#each clip.tags as tag (tag.id)}
					<Tag mini color={tag.color} text={tag.name} />
				{/each}
			</div>
		{/if}
	</div>
</div>
