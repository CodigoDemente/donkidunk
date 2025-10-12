import type { Button } from '../../modules/board/types/Button';
import type { Category } from '../../modules/board/types/Category';
import type { RangeData, RangeDataWithTags } from '../../modules/videoplayer/types/RangeData';

export type Props = {
	categoryId: number;
	allTagsByCategory: Record<string, RangeDataWithTags[] | RangeData[]>;
	duration: number;
	boardCategoriesById: Record<string, Category>;
	buttonsListById: Record<string, Button>;
	playingObject?: RangeDataWithTags | RangeData | null;
	currentTime: number;
	onClick?: (id: number) => void;
};
