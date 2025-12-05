import type { CategoryType } from '../../components/box/types';
import type { DatabaseButton } from './DatabaseButton';
import type { DatabaseTag } from './DatabaseTag';

export type DatabaseCategory = {
	id: string;
	name: string;
	color: string;
	grid_position_x: number;
	grid_position_y: number;
	type: CategoryType;
};

export type DatabaseCategoryWithEvent = {
	id: string;
	name: string;
	color: string;
	grid_position_x: number;
	grid_position_y: number;
	type: CategoryType;
	button_id: DatabaseButton['id'];
	button_name: DatabaseButton['name'];
	button_range: DatabaseButton['range'];
	button_duration: DatabaseButton['duration'];
	button_before: DatabaseButton['before'];
	button_color: DatabaseButton['color'];
};

export type DatabaseCategoryWithTag = {
	id: string;
	name: string;
	color: string;
	grid_position_x: number;
	grid_position_y: number;
	type: CategoryType;
	tag_id: DatabaseTag['id'];
	tag_name: DatabaseTag['name'];
	tag_color: DatabaseTag['color'];
};
