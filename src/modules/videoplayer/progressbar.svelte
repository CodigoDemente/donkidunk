<script lang="ts">
	import Tagtime from '../../components/tagtime/tagtime.svelte';
	import Markers from './markers.svelte';
	import { timelineStore } from '../../stores/timeline/store';
	import { actionCategories, actionsList, eventCategories } from '../../utils/+constants';

	type Props = {
		currentTime: number;
		duration: number;
		toTimeString: (time: number) => string;
		handleDragStart: (event: DragEvent) => void;
		handleDragEnd: (event: DragEvent) => void;
		handleProgressClick: (event: MouseEvent) => void;
		progress: number;
	};

	let {
		currentTime = $bindable(),
		duration,
		toTimeString,
		handleDragStart,
		handleDragEnd,
		handleProgressClick,
		progress = $bindable()
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
			class="relative"
		>
			{#if duration}
				<div class="h-5 w-full rounded-xs bg-gray-950">
					<Markers
						interval={10}
						{duration}
						height="h-3"
						width="w-[1px]"
						color="bg-gray-600"
						label="10-second Marker"
					/>

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

			{#if $timelineStore.events.length > 0}
				<div class="my-2 flex flex-col items-start gap-2">
					<p class="text-xs">Event lines</p>
					{#each $timelineStore.events as eventCategory}
						<div class="relative h-5 w-full rounded-xs bg-gray-800">
							{#each eventCategory.events as event}
								<Tagtime
									start={event.timestamp[0]}
									end={event.timestamp[1]}
									total={duration}
									color={eventCategories[
										eventCategory.eventCategoryId as keyof typeof eventCategories
									]?.color}
									name={eventCategories[
										eventCategory.eventCategoryId as keyof typeof eventCategories
									]?.name}
								/>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
			{#if $timelineStore.actions.length > 0}
				<div class="flex flex-col items-start gap-1">
					<p class="text-xs">Actions</p>
					{#each $timelineStore.actions as category}
						<div class="relative h-5 w-full rounded-xs bg-gray-800">
							{#each category.tags as tag}
								<Tagtime
									start={tag.timestamp[0]}
									end={tag.timestamp[1]}
									total={duration}
									color={actionCategories[category.categoryId as keyof typeof actionCategories]
										?.color}
									name={actionsList[tag.tagId as keyof typeof actionsList]?.name}
								/>
							{/each}
						</div>
					{/each}
				</div>
			{/if}

			<div
				id="time-marker"
				class="absolute top-0 left-0 z-10 h-full w-[1px] rounded-full bg-sky-400"
				style="left: {progress}%"
			></div>
		</button>
	</div>
</div>
