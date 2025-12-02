import type { CategoryType } from '../../components/box/types';
import type { DatabaseButton } from './DatabaseButton';

export type DatabaseCategory = {
	id: number;
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
