import { boardStore } from './store';
import type { Action, Category, Tag } from './types';
import { derived } from 'svelte/store';

const eventCategoriesListById = derived(boardStore, ($boardStore) => {
	return $boardStore.eventCategories.reduce(
		(acc, category) => {
			acc[category.id] = category;
			return acc;
		},
		{} as Record<string, Category>
	);
});

const actionCategoriesListById = derived(boardStore, ($boardStore) => {
	return $boardStore.actionCategories.reduce(
		(acc, category) => {
			acc[category.id] = category;
			return acc;
		},
		{} as Record<string, Category>
	);
});

const tagsListById = derived(boardStore, ($boardStore) => {
	return $boardStore.tagsRelatedToEvents.reduce(
		(acc, tag) => {
			acc[tag.id] = tag;
			return acc;
		},
		{} as Record<string, Tag>
	);
});

const eventButtonsListById = derived(boardStore, ($boardStore) => {
	return $boardStore.eventCategories.reduce(
		(acc, category) => {
			category.buttons.forEach((button) => {
				acc[button.id] = button;
			});
			return acc;
		},
		{} as Record<string, Action>
	);
});

const actionButtonsListById = derived(boardStore, ($boardStore) => {
	return $boardStore.actionCategories.reduce(
		(acc, category) => {
			category.buttons.forEach((button) => {
				acc[button.id] = button;
			});
			return acc;
		},
		{} as Record<string, Action>
	);
});

export const selectorsBoard = {
	eventCategoriesListById,
	actionCategoriesListById,
	tagsListById,
	eventButtonsListById,
	actionButtonsListById
};
