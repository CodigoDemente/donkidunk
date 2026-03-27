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
	<div class="relative aspect-video w-full overflow-hidden bg-black">
		<video
			src={thumbnailSrc}
			class="pointer-events-none h-full w-full object-contain"
			preload="metadata"
			muted
		></video>

		{#if onExpand}
			<div
				class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/card:opacity-100"
			>
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
					<IconArrowsMaximize size={20} />
				</div>
			</div>
		{/if}
	</div>

	<!-- Info area -->
	<div class="flex flex-col gap-1 p-2">
		<p class="truncate text-sm font-semibold text-gray-200">{clip.index + 1}</p>
		<div
			class="w-fit rounded-sm px-2 py-1 text-sm font-medium"
			style={`
			background-color: ${clip.buttonColor};
			color: ${getTextColorForBackground(clip.buttonColor)};
			`}
		>
			{clip.buttonName} ({clip.categoryName})
		</div>
		<p class="text-xs text-gray-500">
			{formatTime(clip.timestamps[0])} - {formatTime(clip.timestamps[1])}
		</p>
		{#if clip.tags.length > 0}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each clip.tags as tag (tag.id)}
					<Tag color={tag.color} text={tag.name} />
				{/each}
			</div>
		{/if}
	</div>
</div>
