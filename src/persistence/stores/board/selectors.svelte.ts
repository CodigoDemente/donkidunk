import BoardStore from './store.svelte';
import type { Action } from './types/Action';
import type { Category } from './types/Category';
import type { Tag } from './types/Tag';

const boardStore = BoardStore.state;

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

export class BoardSelectors {
	static getEventCategoriesById() {
		return eventCategoriesListById;
	}
	static getActionCategoriesById() {
		return actionCategoriesListById;
	}
	static getTagsById() {
		return tagsListById;
	}
	static getEventButtonsById() {
		return eventButtonsListById;
	}
	static getActionButtonsById() {
		return actionButtonsListById;
	}
}
