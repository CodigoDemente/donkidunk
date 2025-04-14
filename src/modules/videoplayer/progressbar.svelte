<script lang="ts">
	import Tagtime from '../../components/tagtime/tagtime.svelte';

	import type { TagsData } from './+data';
	import Markers from './markers.svelte';

	type Props = {
		currentTime: number;
		duration: number;
		toTimeString: (time: number) => string;
		handleDragStart: (event: DragEvent) => void;
		handleDragEnd: (event: DragEvent) => void;
		handleProgressClick: (event: MouseEvent) => void;
		progress: number;
		dataTags: TagsData[];
	};

	let {
		currentTime = $bindable(),
		duration,
		toTimeString,
		handleDragStart,
		handleDragEnd,
		handleProgressClick,
		progress = $bindable(),
		dataTags
	}: Props = $props();
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
				<div class="h-5 w-full rounded-xs bg-gray-900">
					<!-- Render 10-second markers -->
					<Markers
						interval={10}
						{duration}
						height="h-3"
						width="w-[1px]"
						color="bg-gray-600"
						label="10-second Marker"
					/>

					<!-- Render 1-minute markers -->
					<Markers
						interval={60}
						{duration}
						height="h-4"
						width="w-[2px]"
						color="bg-gray-400"
						label="1-minute Marker"
					/>
				</div>
			{/if}
			{#if dataTags.length > 0}
				{#each dataTags as category}
					<div class="relative h-5 w-full rounded-xs bg-gray-800">
						{#each category.tags as tag}
							{#each tag.timestamp as [start, end]}
								<Tagtime {start} {end} total={duration} color={category.color} name={tag.name} />
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
