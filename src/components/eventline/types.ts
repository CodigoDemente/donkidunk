import type { SvelteMap } from 'svelte/reactivity';
import type { Button } from '../../modules/board/types/Button';
import type { Category } from '../../modules/board/types/Category';
import type { RangeData, RangeDataWithTags } from '../../modules/videoplayer/types/RangeData';

export type Props = {
	categoryId: string;
	allTagsByCategory: Record<string, RangeDataWithTags[] | RangeData[]>;
	timelineStart: number;
	timelineEnd: number;
	boardCategoriesById: Record<string, Category>;
	buttonsListById: Record<string, Button>;
	playingObjects?: SvelteMap<string, RangeDataWithTags>;
	eventSelected?: string | null;
	currentTime: number;
	onEventClick: (eventId: string, buttonId: string) => void;
	onEventDblClick: (startTimestamp: number, eventId: string, buttonId: string) => void;
	onEventResize: (
		eventId: string,
		buttonId: string,
		categoryId: string,
		newStart: number,
		newEnd: number
	) => void;
};
