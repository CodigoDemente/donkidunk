import type { DatabaseButton } from './DatabaseButton';

export type DatabaseCategory = {
	id: number;
	name: string;
	color: string;
	grid_position_x: number;
	grid_position_y: number;
	type: 'event' | 'action';
	button_id: DatabaseButton['id'];
	button_name: DatabaseButton['name'];
};
