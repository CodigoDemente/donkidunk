<script lang="ts">
	import type { Action } from '../../modules/board/types/Action';
	import type { Category } from '../../modules/board/types/Category';
	import type {
		RangeData,
		RangeDataWithTags
	} from '../../persistence/stores/timeline/types/RangeData';
	import Tagtime from '../tagtime/tagtime.svelte';

	let {
		categoryId,
		allTagsByCategory,
		duration,
		boardCategoriesById,
		buttonsListById,
		onPlayObject,
		currentTime,
		onClick
	}: {
		categoryId: number;
		allTagsByCategory: Record<string, RangeDataWithTags[] | RangeData[]>;
		duration: number;
		boardCategoriesById: Record<string, Category>;
		buttonsListById: Record<string, Action>;
		onPlayObject?: RangeDataWithTags | null;
		currentTime: number;
		onClick?: (id: number) => void;
	} = $props();
</script>

<div class="relative h-5 w-full rounded-xs bg-gray-800">
	{#if allTagsByCategory[categoryId]}
		{#each allTagsByCategory[categoryId] as event (event.id)}
			<Tagtime
				start={event.timestamp.start}
				end={event.timestamp.end ? event.timestamp.end : currentTime}
				total={duration}
				color={boardCategoriesById[categoryId]?.color}
				name={buttonsListById[event.buttonId]?.name}
				onClick={() => onClick && onPlayObject === null && onClick(event.id)}
			/>
		{/each}
	{/if}
	{#if onPlayObject && categoryId === onPlayObject.categoryId}
		<Tagtime
			start={onPlayObject.timestamp.start}
			end={currentTime}
			total={duration}
			color={boardCategoriesById[categoryId]?.color}
			name={buttonsListById[onPlayObject.buttonId]?.name}
		/>
	{/if}
</div>
