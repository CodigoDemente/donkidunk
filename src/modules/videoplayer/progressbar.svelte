<script lang="ts">
	import { fakeDataTags } from './+data';

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

<div class="flex flex-col">
	<div class="flex w-full flex-row justify-between text-sky-400">
		<span>
			{toTimeString(currentTime)}
		</span>
		<span>
			{toTimeString(duration)}
		</span>
	</div>
	<div class="flex max-h-80 flex-col overflow-y-auto">
		<button
			aria-label="Progress Bar"
			ondragstart={handleDragStart}
			ondragend={handleDragEnd}
			ondrag={handleProgressClick}
			onclick={handleProgressClick}
			draggable="true"
			class="relative flex cursor-default flex-col items-start justify-start gap-1 rounded-xs bg-gray-950"
		>
			{#if duration}
				<div class="h-3 w-full rounded-xs bg-gray-900">
					{#each Array(Math.ceil(duration / 10)).fill(0) as _, index}
						<!-- Mark every 10 seconds -->
						<span
							class="absolute h-3 w-[1px] bg-gray-600"
							style="left: calc(({index * 10} / {duration}) * 100%)"
							aria-label="10-second Marker"
						></span>
					{/each}

					{#each Array(Math.ceil(duration / 60)).fill(0) as _, index}
						<!-- Mark every minute -->
						<span
							class="absolute h-4 w-[2px] bg-gray-400"
							style="left: calc(({index * 60} / {duration}) * 100%)"
							aria-label="1-minute Marker"
						></span>
					{/each}
				</div>
			{/if}
			{#if fakeDataTags.length > 0}
				{#each fakeDataTags as category}
					<div class="relative h-5 w-full rounded-xs bg-gray-800">
						{#each category.tags as tag}
							{#each tag.timestamp as [start, end]}
								<div
									class="absolute h-full rounded-xs"
									style="
                    				left: calc(({start} / {duration}) * 100%);
                    				width: calc(({end} - {start}) / {duration} * 100%);
                    				background-color: {category.color};"
									aria-label={tag.name}
									title={tag.name}
								>
									<!-- Add padding on hover -->
									<div
										class="absolute inset-0 -m-[5px] hidden border border-transparent group-hover:block"
									></div>
								</div>
							{/each}
						{/each}
					</div>
				{/each}
			{/if}

			<div
				id="time-marker"
				class="absolute top-0 left-0 z-10 h-full w-[1px] rounded-full bg-sky-400"
				style="left: {progress}%"
			></div>
		</button>
	</div>
</div>
