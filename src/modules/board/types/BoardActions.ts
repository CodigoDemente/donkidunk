import type { CategoryType } from '../../../components/box/types';

export type BoardActions = {
	setEditingMode: (value: boolean) => void;
	updateCategoryPosition: (
		section: CategoryType,
		categoryId: number,
		x: number,
		y: number
	) => Promise<void>;
	updateCategoryName: (categoryId: number, categoryName: string) => Promise<void>;
	addButtonToCategory: (section: CategoryType, categoryId: number, name: string) => Promise<void>;
	addCategory: (section: CategoryType, name: string, color: string) => Promise<void>;
};
