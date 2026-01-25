<script lang="ts">
	/**
	 * Time Display Component
	 * Shows current time and total duration
	 */

	type Props = {
		currentTime: number;
		duration: number;
		toTimeString: (time: number) => string;
	};

	let { currentTime, duration, toTimeString }: Props = $props();
</script>

<div class="flex w-full flex-row justify-between text-base text-sky-400">
	<span>
		{currentTime >= 0 ? toTimeString(currentTime) : '00:00:00'}
	</span>
	<span>
		{duration >= 0 ? toTimeString(duration) : '00:00:00'}
	</span>
</div>
