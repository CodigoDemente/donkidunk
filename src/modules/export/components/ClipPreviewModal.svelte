<script lang="ts">
	import { IconX } from '@tabler/icons-svelte';
	import type { ExportClip } from '../types';

	interface Props {
		clip: ExportClip;
		videoSrc: string;
		onClose: () => void;
	}

	let { clip, videoSrc, onClose }: Props = $props();

	let videoEl: HTMLVideoElement | null = $state(null);

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	$effect(() => {
		if (!videoEl) return;

		videoEl.src = videoSrc;
		videoEl.currentTime = clip.startTime;
		videoEl.play();

		const handler = () => {
			if (videoEl && videoEl.currentTime >= clip.endTime) {
				videoEl.pause();
			}
		};

		videoEl.addEventListener('timeupdate', handler);

		return () => {
			videoEl?.removeEventListener('timeupdate', handler);
		};
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
	onclick={handleBackdropClick}
>
	<div class="flex w-[80vw] max-w-5xl flex-col overflow-hidden rounded-xl bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-4 py-3">
			<div class="flex flex-col">
				<span class="text-sm font-semibold text-gray-200">{clip.title}</span>
				<span class="text-xs text-gray-400">
					{clip.categoryName} &middot; {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
				</span>
			</div>
			<button
				class="cursor-pointer rounded p-1 text-gray-400 transition-colors hover:text-white"
				onclick={onClose}
				title="Close"
			>
				<IconX size={20} />
			</button>
		</div>

		<!-- Video -->
		<div class="bg-black">
			<video bind:this={videoEl} class="h-auto max-h-[70vh] w-full object-contain" controls muted
			></video>
		</div>
	</div>
</div>
