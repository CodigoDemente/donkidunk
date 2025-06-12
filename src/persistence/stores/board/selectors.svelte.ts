import { boardStore } from './store.svelte';
import type { Action, Category, Tag } from './types';

const eventCategoriesListById = $derived.by(() => {
	return boardStore.eventCategories.reduce(
		(acc, category) => {
			acc[category.id] = category;
			return acc;
		},
		{} as Record<string, Category>
	);
});

const actionCategoriesListById = $derived.by(() => {
	return boardStore.actionCategories.reduce(
		(acc, category) => {
			acc[category.id] = category;
			return acc;
		},
		{} as Record<string, Category>
	);
});

const tagsListById = $derived.by(() => {
	return boardStore.tagsRelatedToEvents.reduce(
		(acc, tag) => {
			acc[tag.id] = tag;
			return acc;
		},
		{} as Record<string, Tag>
	);
});

const eventButtonsListById = $derived.by(() => {
	return boardStore.eventCategories.reduce(
		(acc, category) => {
			category.buttons.forEach((button) => {
				acc[button.id] = button;
			});
			return acc;
		},
		{} as Record<string, Action>
	);
});

const actionButtonsListById = $derived.by(() => {
	return boardStore.actionCategories.reduce(
		(acc, category) => {
			category.buttons.forEach((button) => {
				acc[button.id] = button;
			});
			return acc;
		},
		{} as Record<string, Action>
	);
});

export const selectorsBoard = () => ({
	eventCategoriesListById,
	actionCategoriesListById,
	tagsListById,
	eventButtonsListById,
	actionButtonsListById
});
