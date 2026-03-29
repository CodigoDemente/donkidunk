<script lang="ts">
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { platform } from '@tauri-apps/plugin-os';
	import { IconX } from '@tabler/icons-svelte';
	import ExportClipCard from './ExportClipCard.svelte';
	import ClipPreviewModal from './ClipPreviewModal.svelte';
	import { exportContext } from '../context.svelte';
	import type { GalleryClip } from '../types';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		videoPath: string;
	}

	let { videoPath }: Props = $props();

	const videoSrc = $derived(
		platform() !== 'windows'
			? 'http://localhost:16780/?file=' + encodeURIComponent(videoPath)
			: convertFileSrc(videoPath)
	);

	const exporting = exportContext.get();

	let hideDuplicates = $state(false);
	let isDragOverTimeline = $state(false);
	let dragOverIdx = $state<number | null>(null);
	let dragFromOrderIdx = $state<number | null>(null);
	let previewClip = $state<GalleryClip | null>(null);

	const visibleClips = $derived.by(() => {
		const clips = exporting.galleryClips;
		if (!hideDuplicates) {
			return clips;
		}
		const seen = new SvelteSet<string>();
		return clips.filter((clip) => {
			const key = `${clip.buttonId}:${clip.timestamps[0]}:${clip.timestamps[1]}`;
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});
	});

	function handleClipDragStart(e: DragEvent, clip: GalleryClip) {
		dragFromOrderIdx = null;
		e.dataTransfer?.setData('application/x-clip-index', String(clip.index));
		e.dataTransfer!.effectAllowed = 'copy';
	}

	function handleOrderItemDragStart(e: DragEvent, orderIdx: number) {
		dragFromOrderIdx = orderIdx;
		e.dataTransfer?.setData('application/x-order-idx', String(orderIdx));
		e.dataTransfer!.effectAllowed = 'move';
	}

	function handleTimelineDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOverTimeline = true;
	}

	function handleTimelineDragLeave() {
		isDragOverTimeline = false;
		dragOverIdx = null;
	}

	function handleTimelineDrop(e: DragEvent) {
		e.preventDefault();
		isDragOverTimeline = false;
		dragOverIdx = null;

		if (dragFromOrderIdx !== null) {
			dragFromOrderIdx = null;
			return;
		}

		const clipIndexStr = e.dataTransfer?.getData('application/x-clip-index');
		if (!clipIndexStr) return;
		const clipIndex = Number(clipIndexStr);
		const clip = exporting.galleryClips.find((c) => c.index === clipIndex);
		if (clip) {
			exporting.addClipToOrder(clip);
		}
	}

	function handleItemDragOver(e: DragEvent, idx: number) {
		e.preventDefault();
		dragOverIdx = idx;
	}

	function handleItemDrop(e: DragEvent, toIdx: number) {
		e.preventDefault();
		e.stopPropagation();
		isDragOverTimeline = false;
		dragOverIdx = null;

		if (dragFromOrderIdx !== null) {
			exporting.reorderClip(dragFromOrderIdx, toIdx);
			dragFromOrderIdx = null;
			return;
		}

		const clipIndexStr = e.dataTransfer?.getData('application/x-clip-index');
		if (!clipIndexStr) return;
		const clipIndex = Number(clipIndexStr);
		const clip = exporting.galleryClips.find((c) => c.index === clipIndex);
		if (clip) {
			exporting.addClipToOrder(clip);
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="flex h-full flex-col gap-3">
	<!-- Gallery of available clips -->
	<div class="flex min-h-0 flex-1 flex-col gap-2">
		<div class="flex shrink-0 items-center justify-between">
			<p class="text-sm font-semibold text-gray-300">Available Clips</p>
			<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
				<input
					type="checkbox"
					class="accent-tertiary h-4 w-4 cursor-pointer"
					bind:checked={hideDuplicates}
				/>
				Do not repeat same clips
			</label>
		</div>

		<div class="flex-1 overflow-y-auto pr-1">
			{#if exporting.loading}
				<div class="flex items-center justify-center py-12">
					<div
						class="border-tertiary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
					></div>
					<p class="ml-3 text-sm text-gray-400">Loading...</p>
				</div>
			{:else if visibleClips.length === 0}
				<p class="py-4 text-sm text-gray-500">No clips available</p>
			{:else}
				<div
					class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3 pb-2"
					role="list"
					aria-label="Available clips gallery"
				>
					{#each visibleClips as clip (clip.index)}
						<ExportClipCard
							{clip}
							{videoSrc}
							ondragstart={(e) => handleClipDragStart(e, clip)}
							onExpand={(c) => (previewClip = c)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Export order timeline: fixed height so layout does not jump when clips are added -->
	<div class="flex shrink-0 flex-col">
		<p class="mb-2 text-sm font-semibold text-gray-300">Export Order</p>
		<div
			class="flex min-h-42 flex-col overflow-y-auto rounded-lg border-2 border-dashed p-3 transition-colors {isDragOverTimeline
				? 'border-blue-400 bg-blue-900/10'
				: 'border-gray-600 bg-gray-800/50'}"
			ondragover={handleTimelineDragOver}
			ondragleave={handleTimelineDragLeave}
			ondrop={handleTimelineDrop}
			role="list"
			aria-label="Export order timeline"
		>
			{#if exporting.clipsOrdered.length === 0}
				<div class="flex min-h-0 flex-1 flex-col items-center justify-center px-2 text-center">
					<p class="text-sm text-gray-500">Drag clips here to set the export order</p>
				</div>
			{:else}
				<div class="flex flex-wrap gap-3">
					{#each exporting.clipsOrdered as clip, idx (idx)}
						<div
							class="flex w-40 shrink-0 cursor-grab flex-col overflow-hidden rounded-lg border transition-colors active:cursor-grabbing {dragOverIdx ===
							idx
								? 'border-blue-400 bg-blue-900/20'
								: 'border-gray-600 bg-gray-700'}"
							draggable="true"
							ondragstart={(e) => handleOrderItemDragStart(e, idx)}
							ondragover={(e) => handleItemDragOver(e, idx)}
							ondrop={(e) => handleItemDrop(e, idx)}
							role="listitem"
						>
							<!-- Thumbnail (paused <video> at clip start, not playable) -->
							<div class="relative aspect-video w-full bg-black">
								<video
									src={`${videoSrc}#t=${clip.timestamps[0]}`}
									class="pointer-events-none h-full w-full object-contain"
									preload="metadata"
									muted
								></video>
								<span
									class="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white"
								>
									{idx + 1}
								</span>
								<button
									class="absolute top-1 right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-black/70 text-gray-300 transition-colors hover:text-red-400"
									onclick={() => exporting.removeClipFromOrder(idx)}
									title="Remove from timeline"
								>
									<IconX size={12} />
								</button>
							</div>

							<div class="flex flex-col gap-0.5 p-1.5">
								<span class="truncate text-xs font-medium" style:color={clip.buttonColor}>
									{clip.buttonName}
								</span>
								<span class="text-[10px] text-gray-400">
									{formatTime(clip.timestamps[0])} - {formatTime(clip.timestamps[1])}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Clip preview modal (single shared video player) -->
{#if previewClip}
	<ClipPreviewModal clip={previewClip} {videoSrc} onClose={() => (previewClip = null)} />
{/if}
