<script lang="ts">
	import Stroke from '../../components/stroke/stroke.svelte';
	import { selectorsBoard } from '../../persistence/stores/board/selectors.svelte';
	import { timelineActions } from '../../persistence/stores/timeline/actions';
	import { selectorsTimeline } from '../../persistence/stores/timeline/selectors.svelte';
	import Markers from './markers.svelte';
	import Tagsbox from './tagsbox.svelte';

	const {
		eventCategoriesListById,
		actionCategoriesListById,
		actionButtonsListById,
		eventButtonsListById
	} = selectorsBoard;
	const { timelineEventsByCategory, timelineActionsByCategory, timelineOnPlay } = selectorsTimeline;

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
				{#if Object.entries(eventCategoriesListById).length > 0}
					<div class="mt-2 mb-4 flex flex-col items-start gap-2">
						{#each Object.keys(eventCategoriesListById) as categoryId (categoryId)}
							<Stroke
								{categoryId}
								allTagsByCategory={timelineEventsByCategory}
								{duration}
								boardCategoriesById={eventCategoriesListById}
								buttonsListById={eventButtonsListById}
								onPlayObject={timelineOnPlay}
								{currentTime}
								onClick={timelineActions.setEventSelected}
							/>
						{/each}
					</div>
				{/if}
				{#if Object.entries(actionCategoriesListById).length > 0}
					<div class="flex w-full flex-col items-start gap-1">
						{#each Object.keys(actionCategoriesListById) as categoryId (categoryId)}
							<Stroke
								{categoryId}
								allTagsByCategory={timelineActionsByCategory}
								{duration}
								boardCategoriesById={actionCategoriesListById}
								buttonsListById={actionButtonsListById}
								{currentTime}
							/>
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
