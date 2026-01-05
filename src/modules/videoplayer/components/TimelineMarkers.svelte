<script lang="ts">
	/**
	 * Timeline Markers Component
	 * Displays time markers that adapt to zoom level
	 */

	import {
		getTimeInterval,
		generateMarkerPositions,
		getMarkerPercentage
	} from '../utils/timeMarkersUtils';

	type Props = {
		leftLimitTime: number;
		rightLimitTime: number;
		visibleDuration: number;
		toTimeString: (time: number) => string;
	};

	let { leftLimitTime, rightLimitTime, visibleDuration, toTimeString }: Props = $props();

	// Calculate appropriate interval based on zoom level
	const interval = $derived(getTimeInterval(visibleDuration));

	// Generate marker positions within visible range
	const markerPositions = $derived(
		generateMarkerPositions(leftLimitTime, rightLimitTime, interval.seconds)
	);

	// Calculate percentage position for each marker
	function getPosition(markerTime: number): number {
		return getMarkerPercentage(markerTime, leftLimitTime, visibleDuration);
	}
</script>

<div class="mb-2 flex h-6">
	<div class="w-[var(--spacing-category-name-width)]"></div>
	<div class="relative flex-1">
		{#each markerPositions as markerTime (markerTime)}
			{@const position = getPosition(markerTime)}
			<div
				class="absolute top-0 flex flex-col items-center"
				style="left: {position}%; transform: translateX(-50%)"
			>
				<!-- Time label on top, centered -->
				<span class="text-[10px] whitespace-nowrap text-gray-400">
					{toTimeString(markerTime)}
				</span>
				<!-- Marker line -->
				<div
					class="mt-[-4px] h-2 w-px bg-gray-600"
					aria-label="Time marker at {toTimeString(markerTime)}"
				></div>
			</div>
		{/each}
	</div>
</div>
