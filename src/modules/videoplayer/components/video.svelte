<script lang="ts">
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { platform } from '@tauri-apps/plugin-os';
	import { SkipType } from '../types/SkipType';
	import { SkipDirection } from '../types/SkipDirection';
	import { shouldIgnoreKeyboardEvent } from '../handlers/keyboardHandlers';

	type Props = {
		video: string | undefined;
		currentTime?: number;
		duration?: number;
		playbackSpeed?: number;
		videoPlayerRef?: HTMLVideoElement | null;
		onPlayStateChange?: (isPlaying: boolean) => void;
		onSkip?: (type: SkipType, direction: SkipDirection) => void;
		onHighlightChange?: (highlight: 'forward' | 'backward' | 'play' | null) => void;
		onPlay?: () => void;
	};

	let {
		video,
		currentTime = $bindable(),
		duration = $bindable(),
		playbackSpeed = 1.0,
		videoPlayerRef = $bindable(),
		onPlayStateChange,
		onSkip,
		onHighlightChange,
		onPlay
	}: Props = $props();

	let videoPlayer: HTMLVideoElement | null = $state(null);

	$effect(() => {
		videoPlayerRef = videoPlayer;
	});
	let isPlaying = $state(false);

	let trackpadDeltaX = $state(0);
	let trackpadTimeout: ReturnType<typeof setTimeout> | null = null;

	// Timeout to prevent single click when double click is detected
	let clickTimeout: ReturnType<typeof setTimeout> | null = null;

	/* ==================== VIDEO INITIALIZATION ==================== */

	$effect(() => {
		if (!videoPlayer) return;

		// Si no hay video, limpiar el source existente
		if (!video) {
			if (videoPlayer.firstChild) {
				// eslint-disable-next-line svelte/no-dom-manipulating
				videoPlayer.removeChild(videoPlayer.firstChild);
			}
			videoPlayer.load();
			duration = 0;
			currentTime = 0;
			return;
		}

		const videoUrl =
			platform() !== 'windows'
				? 'http://localhost:16780/?file=' + encodeURIComponent(video)
				: convertFileSrc(video);

		const source = document.createElement('source');
		source.type = 'video/mp4';
		source.src = videoUrl;

		if (videoPlayer.firstChild) {
			// eslint-disable-next-line svelte/no-dom-manipulating
			videoPlayer.removeChild(videoPlayer.firstChild);
		}

		// eslint-disable-next-line svelte/no-dom-manipulating
		videoPlayer.appendChild(source);
		videoPlayer.load();
		videoPlayer.currentTime = 0.1;
	});

	/* ==================== VIDEO EFFECTS ==================== */

	$effect(() => {
		if (!videoPlayer) return;

		videoPlayer.onplay = () => {
			isPlaying = true;
			onPlayStateChange?.(isPlaying);
		};

		videoPlayer.onpause = () => {
			isPlaying = false;
			onPlayStateChange?.(isPlaying);
		};
	});

	$effect(() => {
		if (!videoPlayer) return;
		videoPlayer.playbackRate = playbackSpeed;
	});

	/* ==================== KEYBOARD SHORTCUT ==================== */

	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (shouldIgnoreKeyboardEvent(e)) return;
			if (e.key !== ' ' || !onPlay) return;

			e.preventDefault();
			onPlay();
			onHighlightChange?.('play');
			setTimeout(() => {
				onHighlightChange?.(null);
			}, 500);
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});

	/* ==================== TRACKPAD GESTURE HANDLER ==================== */

	function handleTrackpadGesture(event: WheelEvent) {
		if (event.ctrlKey || event.metaKey) return;
		if (!onSkip) return;

		// Check if it's a horizontal gesture (deltaX is significant)
		if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
			event.preventDefault();
			event.stopPropagation();

			trackpadDeltaX += event.deltaX;

			if (trackpadTimeout) {
				clearTimeout(trackpadTimeout);
			}

			const skipThreshold = 50;

			if (Math.abs(trackpadDeltaX) >= skipThreshold) {
				const direction = trackpadDeltaX < 0 ? SkipDirection.FORWARD : SkipDirection.BACKWARD;
				onSkip(SkipType.SHORT, direction);
				trackpadDeltaX = 0;
			}

			trackpadTimeout = setTimeout(() => {
				trackpadDeltaX = 0;
				trackpadTimeout = null;
			}, 150);
		}
	}

	/* ==================== CLICK HANDLERS ==================== */

	function handleVideoClick(_event: MouseEvent) {
		if (!videoPlayer || !onPlay) return;

		// Cancel if this is part of a double click
		if (clickTimeout) {
			clearTimeout(clickTimeout);
			clickTimeout = null;
			return;
		}

		// Wait to detect if a double click is coming
		clickTimeout = setTimeout(() => {
			clickTimeout = null;
			onPlay();
			onHighlightChange?.('play');
			setTimeout(() => {
				onHighlightChange?.(null);
			}, 500);
		}, 200);
	}

	function handleVideoDoubleClick(event: MouseEvent) {
		if (!videoPlayer || !onSkip) return;

		// Cancel the single click timeout
		if (clickTimeout) {
			clearTimeout(clickTimeout);
			clickTimeout = null;
		}

		const rect = videoPlayer.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const videoWidth = rect.width;
		const midpoint = videoWidth / 2;

		const direction = clickX < midpoint ? SkipDirection.BACKWARD : SkipDirection.FORWARD;

		onHighlightChange?.(direction === SkipDirection.BACKWARD ? 'backward' : 'forward');

		setTimeout(() => {
			onHighlightChange?.(null);
		}, 500);

		onSkip(SkipType.LONG, direction);
	}
</script>

<video
	id="video-player"
	bind:this={videoPlayer}
	bind:currentTime
	bind:duration
	class="min-h-0 w-full flex-1 bg-black object-contain"
	onwheel={handleTrackpadGesture}
	onclick={handleVideoClick}
	ondblclick={handleVideoDoubleClick}
></video>
