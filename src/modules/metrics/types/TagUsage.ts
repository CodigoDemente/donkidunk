import type { CategoryUsage } from './CategoryUsage';

export interface TagUsage {
	id: string;
	name: string;
	color: string;
	category: CategoryUsage;
	count: number;
}
