<script lang="ts">
	import type { Action, Category } from '../../stores/board/types';
	import type { RangeData, RangeDataWithTags } from '../../stores/timeline/types';
	import Tagtime from '../tagtime/tagtime.svelte';

	export let categoryId: string;
	export let allTagsByCategory: Record<string, RangeDataWithTags[] | RangeData[]>;
	export let duration: number;
	export let boardCategoriesById: Record<string, Category>;
	export let buttonsListById: Record<string, Action>;
	export let onPlayObject: RangeDataWithTags | null = null;
	export let currentTime: number;
	export let onClick: (number: string) => void = () => {};
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
