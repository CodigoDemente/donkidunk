/**
 * Event Handlers
 * Handlers for timeline event interactions (click, double-click, resize, context menu)
 */

import type { Timeline } from '../context.svelte';
import { Menu, MenuItem } from '@tauri-apps/api/menu';

/**
 * Handle click on an event in the timeline
 */
export function handleEventClick(timeline: Timeline, eventId: string, buttonId: string): void {
	if (!timeline.eventsPlaying.has(buttonId)) {
		timeline.setEventSelected(eventId);
	}
}

/**
 * Handle blur on an event (deselect)
 */
export function handleEventBlur(timeline: Timeline): void {
	if (timeline.eventsPlaying.size > 0) return;
	timeline.setEventSelected(null);
}

/**
 * Handle double-click on an event to navigate to its timestamp
 */
export function handleEventDblClick(
	timeline: Timeline,
	startTimestamp: number,
	eventId: string,
	buttonId: string,
	onTimeChange: (time: number) => void
): void {
	if (timeline.eventsPlaying.size > 0) return;
	onTimeChange(startTimestamp);
	if (!timeline.eventsPlaying.has(buttonId)) {
		timeline.setEventSelected(eventId);
	}
}

/**
 * Handle event resize (update timestamps)
 */
export async function handleEventResize(
	timeline: Timeline,
	eventId: string,
	buttonId: string,
	categoryId: string,
	newStart: number,
	newEnd: number
): Promise<void> {
	if (timeline.eventsPlaying.size > 0) return;
	if (!timeline.eventsPlaying.has(buttonId)) {
		timeline.setEventSelected(eventId);
	}
	await timeline.updateEvent(eventId, buttonId, categoryId, { start: newStart, end: newEnd });
}

/**
 * Handle category play/stop toggle
 */
export function handleCategoryPlayAll(timeline: Timeline, categoryId: string): void {
	if (timeline.currentPlaybackCategoryId === categoryId) {
		timeline.stopCategoryPlayback();
	} else {
		timeline.playAllEventsFromCategory(categoryId);
	}
}

/**
 * Handle context menu on an event
 */
export async function handleEventContextMenu(timeline: Timeline, eventId: string): Promise<void> {
	const deleteItem = await MenuItem.new({
		text: 'Delete event',
		action: async () => {
			await timeline.removeEvent(eventId);
		}
	});

	const menu = await Menu.new({
		items: [deleteItem]
	});

	await menu.popup();
}
