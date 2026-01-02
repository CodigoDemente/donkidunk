import type { CategoryUsage } from './CategoryUsage';

export interface EventUsage {
	id: string;
	name: string;
	category: CategoryUsage;
	color: string;
	count: number;
}
