<script lang="ts">
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { platform } from '@tauri-apps/plugin-os';
	import { SkipType } from './types/SkipType';
	import { SkipDirection } from './types/SkipDirection';

	type Props = {
		video: string | undefined;
		currentTime?: number;
		duration?: number;
		playbackSpeed?: number;
		videoPlayerRef?: HTMLVideoElement | null;
		onTimeChange?: (time: number) => void;
		onDurationChange?: (duration: number) => void;
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
		onTimeChange,
		onDurationChange,
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
		if (!video || !videoPlayer) return;

		const videoUrl =
			platform() !== 'windows'
				? 'http://localhost:16780/?file=' + encodeURIComponent(video)
				: convertFileSrc(video);

		const source = document.createElement('source');
		source.type = 'video/mp4';
		source.src = videoUrl;

		if (videoPlayer.firstChild) {
			videoPlayer.removeChild(videoPlayer.firstChild);
		}

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

	function handleVideoClick(event: MouseEvent) {
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
	class={{
		'max-h-[50vh]': true,
		'w-full': true,
		'bg-black': !!videoPlayer
	}}
	onwheel={handleTrackpadGesture}
	onclick={handleVideoClick}
	ondblclick={handleVideoDoubleClick}
></video>
