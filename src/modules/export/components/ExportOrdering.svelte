<script lang="ts">
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { platform } from '@tauri-apps/plugin-os';
	import ExportClipCard from './ExportClipCard.svelte';
	import ExportTimeline from './ExportTimeline.svelte';
	import ClipPreviewModal from './ClipPreviewModal.svelte';
	import type { ExportClip } from '../types';

	interface Props {
		videoPath: string;
	}

	let { videoPath }: Props = $props();

	const videoSrc = $derived(
		platform() !== 'windows'
			? 'http://localhost:16780/?file=' + encodeURIComponent(videoPath)
			: convertFileSrc(videoPath)
	);

	// Mock clips for now
	const availableClips: ExportClip[] = $state([
		{
			id: 'clip-1',
			title: 'Goal celebration',
			categoryName: 'Highlights',
			startTime: 12,
			endTime: 27,
			tags: [
				{ id: 't1', name: 'Goal', color: '#22c55e' },
				{ id: 't2', name: 'Team A', color: '#3b82f6' }
			]
		},
		{
			id: 'clip-2',
			title: 'Corner kick',
			categoryName: 'Set pieces',
			startTime: 45,
			endTime: 58,
			tags: [{ id: 't3', name: 'Corner', color: '#eab308' }]
		},
		{
			id: 'clip-3',
			title: 'Free kick attempt',
			categoryName: 'Set pieces',
			startTime: 72,
			endTime: 85,
			tags: [
				{ id: 't4', name: 'Free kick', color: '#ef4444' },
				{ id: 't2', name: 'Team A', color: '#3b82f6' }
			]
		},
		{
			id: 'clip-4',
			title: 'Defensive block',
			categoryName: 'Defense',
			startTime: 102,
			endTime: 110,
			tags: [{ id: 't5', name: 'Block', color: '#a855f7' }]
		},
		{
			id: 'clip-5',
			title: 'Counter attack',
			categoryName: 'Highlights',
			startTime: 130,
			endTime: 148,
			tags: [
				{ id: 't6', name: 'Fast break', color: '#f97316' },
				{ id: 't2', name: 'Team A', color: '#3b82f6' }
			]
		},
		{
			id: 'clip-6',
			title: 'Penalty save',
			categoryName: 'Highlights',
			startTime: 180,
			endTime: 195,
			tags: [{ id: 't7', name: 'Penalty', color: '#ec4899' }]
		}
	]);

	let orderedClips = $state<ExportClip[]>([]);
	let expandedClip = $state<ExportClip | null>(null);

	const galleryClips = $derived(
		availableClips.filter((clip) => !orderedClips.some((oc) => oc.id === clip.id))
	);

	function handleClipDragStart(e: DragEvent, clip: ExportClip) {
		e.dataTransfer?.setData('text/plain', clip.id);
	}

	function handleTimelineDrop(clipId: string) {
		const clip = availableClips.find((c) => c.id === clipId);
		if (clip && !orderedClips.some((oc) => oc.id === clipId)) {
			orderedClips = [...orderedClips, clip];
		}
	}

	function handleTimelineReorder(fromIdx: number, toIdx: number) {
		const updated = [...orderedClips];
		const [moved] = updated.splice(fromIdx, 1);
		updated.splice(toIdx, 0, moved);
		orderedClips = updated;
	}

	function handleTimelineRemove(clipId: string) {
		orderedClips = orderedClips.filter((c) => c.id !== clipId);
	}

	function handleExpand(clip: ExportClip) {
		expandedClip = clip;
	}

	function handleCloseModal() {
		expandedClip = null;
	}
</script>

<div class="flex h-full flex-col gap-3">
	<!-- Gallery of available clips -->
	<div class="flex min-h-0 flex-1 flex-col gap-2">
		<p class="shrink-0 text-sm font-semibold text-gray-300">Available Clips</p>
		<div class="flex-1 overflow-y-auto pr-1">
			{#if galleryClips.length === 0}
				<p class="py-4 text-sm text-gray-500">All clips have been placed in the timeline</p>
			{:else}
				<div
					class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3 pb-2"
					role="list"
					aria-label="Available clips gallery"
				>
					{#each galleryClips as clip (clip.id)}
						<ExportClipCard
							{clip}
							{videoSrc}
							ondragstart={(e) => handleClipDragStart(e, clip)}
							onExpand={handleExpand}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Export order timeline -->
	<div class="shrink-0">
		<p class="mb-2 text-sm font-semibold text-gray-300">Export Order</p>
		<ExportTimeline
			clips={orderedClips}
			onDrop={handleTimelineDrop}
			onReorder={handleTimelineReorder}
			onRemove={handleTimelineRemove}
		/>
	</div>
</div>

{#if expandedClip}
	<ClipPreviewModal clip={expandedClip} {videoSrc} onClose={handleCloseModal} />
{/if}
