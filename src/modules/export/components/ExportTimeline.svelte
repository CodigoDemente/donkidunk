<script lang="ts">
	import { IconX } from '@tabler/icons-svelte';
	import type { ExportClip } from '../types';

	interface Props {
		clips: ExportClip[];
		onDrop?: (clipId: string) => void;
		onReorder?: (fromIdx: number, toIdx: number) => void;
		onRemove?: (clipId: string) => void;
	}

	let { clips, onDrop, onReorder, onRemove }: Props = $props();

	let isDragOver = $state(false);
	let dragOverIdx = $state<number | null>(null);
	let dragFromIdx = $state<number | null>(null);

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
		dragOverIdx = null;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		dragOverIdx = null;

		const clipId = e.dataTransfer?.getData('text/plain');
		if (!clipId) return;

		if (dragFromIdx !== null) {
			const toIdx = clips.length - 1;
			if (dragFromIdx !== toIdx) {
				onReorder?.(dragFromIdx, toIdx);
			}
			dragFromIdx = null;
		} else {
			onDrop?.(clipId);
		}
	}

	function handleItemDragStart(e: DragEvent, idx: number) {
		dragFromIdx = idx;
		e.dataTransfer?.setData('text/plain', clips[idx].id);
	}

	function handleItemDragOver(e: DragEvent, idx: number) {
		e.preventDefault();
		dragOverIdx = idx;
	}

	function handleItemDrop(e: DragEvent, toIdx: number) {
		e.preventDefault();
		e.stopPropagation();
		isDragOver = false;
		dragOverIdx = null;

		if (dragFromIdx !== null) {
			if (dragFromIdx !== toIdx) {
				onReorder?.(dragFromIdx, toIdx);
			}
			dragFromIdx = null;
		} else {
			const clipId = e.dataTransfer?.getData('text/plain');
			if (clipId) {
				onDrop?.(clipId);
			}
		}
	}
</script>

<div
	class="flex min-h-[80px] items-start gap-2 overflow-x-auto rounded-lg border-2 border-dashed p-3 transition-colors {isDragOver
		? 'border-blue-400 bg-blue-900/10'
		: 'border-gray-600 bg-gray-800/50'}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="list"
	aria-label="Export timeline"
>
	{#if clips.length === 0}
		<p class="w-full py-4 text-center text-sm text-gray-500">
			Drag clips here to set the export order
		</p>
	{:else}
		{#each clips as clip, idx (clip.id)}
			<div
				class="flex shrink-0 cursor-grab items-center gap-2 rounded border px-3 py-2 transition-colors active:cursor-grabbing {dragOverIdx ===
				idx
					? 'border-blue-400 bg-blue-900/20'
					: 'border-gray-600 bg-gray-700'}"
				draggable="true"
				ondragstart={(e) => handleItemDragStart(e, idx)}
				ondragover={(e) => handleItemDragOver(e, idx)}
				ondrop={(e) => handleItemDrop(e, idx)}
				role="listitem"
			>
				<span class="text-xs font-bold text-gray-400">{idx + 1}</span>
				<div class="flex flex-col">
					<span class="text-sm font-medium text-gray-200">{clip.title}</span>
					<span class="text-xs text-gray-400">
						{formatTime(clip.startTime)} - {formatTime(clip.endTime)}
					</span>
				</div>
				<button
					class="ml-2 cursor-pointer text-gray-400 transition-colors hover:text-red-400"
					onclick={() => onRemove?.(clip.id)}
					title="Remove from timeline"
				>
					<IconX size={14} />
				</button>
			</div>
		{/each}
	{/if}
</div>
