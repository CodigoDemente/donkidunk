<script lang="ts">
	import Tagtime from '../../components/tagtime/tagtime.svelte';
	import Markers from './markers.svelte';
	import { actionCategories, actionsList, eventCategories } from '../../utils/+constants';
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { timelineStore } from '../../persistence/stores/timeline/store';

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

	let isBoxOpen: boolean = $state(false);
	let tags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4'];
</script>

<div class="flex w-full flex-row">
	<div class="w-1/18"></div>
	<div class="flex w-full flex-col">
		<div class="flex w-full flex-row justify-between text-sky-400">
			<span>
				{toTimeString(currentTime)}
			</span>
			<span>
				{toTimeString(duration)}
			</span>
		</div>
		{#if duration}
			<div class="relative h-5 rounded-xs bg-gray-950">
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
		<div class="flex max-h-40 flex-col overflow-y-auto">
			<button
				aria-label="Progress Bar"
				ondragstart={handleDragStart}
				ondragend={handleDragEnd}
				ondrag={handleProgressClick}
				onclick={handleProgressClick}
				draggable="true"
				class="relative"
			>
				{#if $timelineStore.events.length > 0}
					<div class="mt-2 mb-4 flex flex-col items-start gap-2">
						{#each $timelineStore.events as eventCategory (eventCategory.eventCategoryId)}
							<div class="relative h-5 w-full rounded-xs bg-gray-800">
								{#each eventCategory.events as event (event.eventId)}
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
					<div class="flex w-full flex-col items-start gap-1">
						{#each $timelineStore.actions as category (category.categoryId)}
							<div class="relative h-5 w-full rounded-xs bg-gray-800">
								{#each category.tags as tag, index (index)}
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
</div>
<div class="relative mt-2 bg-gray-700">
	<!-- Line that toggles the box -->
	<button
		class="flex w-full cursor-pointer items-center bg-gray-700 px-1 text-gray-200"
		onclick={() => (isBoxOpen = !isBoxOpen)}
	>
		<p class="text-xs">Tags related</p>
		<IconChevronDown
			class="ml-auto p-1 transition-transform duration-200"
			style="transform: {isBoxOpen ? 'rotate(180deg)' : 'rotate(0deg)'}"
		/>
	</button>

	<!-- Collapsible box -->
	{#if isBoxOpen}
		<div class="rounded-md bg-gray-800 p-2 shadow-md">
			<div class="flex flex-wrap gap-2">
				{#each tags as tag}
					<button
						class="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:bg-sky-600"
					>
						{tag}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
