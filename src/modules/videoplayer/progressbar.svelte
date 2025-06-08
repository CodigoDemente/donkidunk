<script lang="ts">
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { selectorsTimeline } from '../../stores/timeline/selectors';
	import type { RangeData, RangeDataWithTags } from '../../stores/timeline/types';
	import Markers from './markers.svelte';
	import { selectorsBoard } from '../../stores/board/selectors';
	import Tagtime from '../../components/tagtime/tagtime.svelte';
	import { timelineActions } from '../../stores/timeline/actions';
	import { timelineStore } from '../../stores/timeline/store';
	import Tagsbox from './tagsbox.svelte';

	const {
		eventCategoriesListById,
		actionCategoriesListById,
		actionButtonsListById,
		eventButtonsListById,
		tagsListById
	} = selectorsBoard;
	const {
		timelineEventsByCategory,
		timelineActionsByCategory,
		timelineOnPlay,
		timelineSelectedEvent
	} = selectorsTimeline;

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
				{#if Object.entries($eventCategoriesListById).length > 0}
					<div class="mt-2 mb-4 flex flex-col items-start gap-2">
						{#each Object.keys($eventCategoriesListById) as categoryId}
							<div class="relative h-5 w-full rounded-xs bg-gray-800">
								{#if $timelineEventsByCategory[categoryId]}
									{#each $timelineEventsByCategory[categoryId] as event (event.id)}
										<Tagtime
											start={event.timestamp.start}
											end={event.timestamp.end}
											total={duration}
											color={$eventCategoriesListById[categoryId]?.color}
											name={$eventButtonsListById[event.buttonId]?.name}
											onClick={() =>
												$timelineOnPlay === null && timelineActions.setEventSelected(event.id)}
										/>
									{/each}
								{/if}
								{#if $timelineOnPlay && categoryId === $timelineOnPlay.categoryId}
									<Tagtime
										start={$timelineOnPlay.timestamp.start}
										end={currentTime}
										total={duration}
										color={$eventCategoriesListById[categoryId]?.color}
										name={$eventButtonsListById[$timelineOnPlay.buttonId]?.name}
									/>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
				{#if Object.entries($actionCategoriesListById).length > 0}
					<div class="flex w-full flex-col items-start gap-1">
						{#each Object.keys($actionCategoriesListById) as categoryId}
							<div class="relative h-5 w-full rounded-xs bg-gray-800">
								{#if $timelineActionsByCategory[categoryId]}
									{#each $timelineActionsByCategory[categoryId] as action (action.id)}
										<Tagtime
											start={action.timestamp.start}
											end={action.timestamp.end ? action.timestamp.end : currentTime}
											total={duration}
											color={$actionCategoriesListById[categoryId]?.color}
											name={$actionButtonsListById[action.buttonId]?.name}
										/>
									{/each}
								{/if}
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
	<Tagsbox />
</div>
