<script lang="ts">
	type Props = {
		currentTime: number;
		duration: number;
	};

	let { currentTime = $bindable(), duration }: Props = $props();

	let progress: number = $derived((currentTime / duration) * 100);

	function handleProgressClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const target = event.target as HTMLElement;

		// If not a button, the user clicked the time marker
		if (target.nodeName !== 'BUTTON') {
			return;
		}

		const fullWidth = target.offsetWidth;

		if (event.offsetX < 0 || event.offsetX > fullWidth) {
			return;
		}

		const horizontalPosition = event.offsetX;

		const percentage = horizontalPosition / fullWidth;

		currentTime = percentage * duration;
	}

	function handleDragStart(event: DragEvent) {
		var img = new Image();
		img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
		event.dataTransfer?.setDragImage(img, 0, 0);
	}

	function handleDragEnd(event: DragEvent) {
		event.preventDefault();
	}

	function toZeroPad(num: number) {
		return ('00' + num).slice(-2);
	}

	function toTimeString(num: number) {
		const hours = Math.floor(num / 3600);
		const minutes = Math.floor((num % 3600) / 60);
		const seconds = Math.floor(num % 60);

		return `${toZeroPad(hours)}:${toZeroPad(minutes)}:${toZeroPad(seconds)}`;
	}
</script>

<div class="flex flex-row items-center gap-2">
	<span>
		{toTimeString(currentTime)}
	</span>
	<button
		aria-label="Progress Bar"
		ondragstart={handleDragStart}
		ondragend={handleDragEnd}
		ondrag={handleProgressClick}
		onclick={handleProgressClick}
		draggable="true"
		class="relative h-12 w-full cursor-default rounded-lg bg-gray-500"
	>
		<div
			id="time-marker"
			class="absolute h-12 w-[1px] rounded-full bg-black"
			style="top: 0; left: {progress}%"
		></div>
		<div></div></button
	>
	<span>
		{toTimeString(duration)}
	</span>
</div>
