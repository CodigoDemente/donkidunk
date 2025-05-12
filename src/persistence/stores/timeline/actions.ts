import { timelineStore } from './store';
import type { EventsData, TagsData } from './types';

export const timelineActions = {
	// Subscribe to the store
	subscribe: timelineStore.subscribe,

	// Add a new event category
	addEventCategory(newCategory: EventsData) {
		timelineStore.update((state) => ({
			...state,
			events: [...state.events, newCategory]
		}));
	},

	// Add an event to a specific category
	addEvent(eventCategoryId: string, newEvent: EventsData['events'][0]) {
		timelineStore.update((state) => ({
			...state,
			events: state.events.map((category) =>
				category.eventCategoryId === eventCategoryId
					? { ...category, events: [...category.events, newEvent] }
					: category
			)
		}));
	},

	// Update an event in a specific category
	updateEvent(
		eventCategoryId: string,
		eventId: string,
		updatedEvent: Partial<EventsData['events'][0]>
	) {
		timelineStore.update((state) => ({
			...state,
			events: state.events.map((category) =>
				category.eventCategoryId === eventCategoryId
					? {
							...category,
							events: category.events.map((event) =>
								event.eventId === eventId ? { ...event, ...updatedEvent } : event
							)
						}
					: category
			)
		}));
	},

	// Remove an event from a specific category
	removeEvent(eventCategoryId: string, eventId: string) {
		timelineStore.update((state) => ({
			...state,
			events: state.events.map((category) =>
				category.eventCategoryId === eventCategoryId
					? {
							...category,
							events: category.events.filter((event) => event.eventId !== eventId)
						}
					: category
			)
		}));
	},

	// Add a new action category
	addActionCategory(newCategory: TagsData) {
		timelineStore.update((state) => ({
			...state,
			actions: [...state.actions, newCategory]
		}));
	},

	// Add a tag to a specific action category
	addAction(categoryId: string, newTag: TagsData['tags'][0]) {
		timelineStore.update((state) => ({
			...state,
			actions: state.actions.map((category) =>
				category.categoryId === categoryId
					? { ...category, tags: [...category.tags, newTag] }
					: category
			)
		}));
	},

	// Update a tag in a specific action category
	updateAction(categoryId: string, tagId: string, updatedTag: Partial<TagsData['tags'][0]>) {
		timelineStore.update((state) => ({
			...state,
			actions: state.actions.map((category) =>
				category.categoryId === categoryId
					? {
							...category,
							tags: category.tags.map((tag) =>
								tag.tagId === tagId ? { ...tag, ...updatedTag } : tag
							)
						}
					: category
			)
		}));
	},

	// Remove a tag from a specific action category
	removeAction(categoryId: string, tagId: string) {
		timelineStore.update((state) => ({
			...state,
			actions: state.actions.map((category) =>
				category.categoryId === categoryId
					? {
							...category,
							tags: category.tags.filter((tag) => tag.tagId !== tagId)
						}
					: category
			)
		}));
	}
};
