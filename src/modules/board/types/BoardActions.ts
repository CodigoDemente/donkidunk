export type BoardActions = {
	setEditingMode: (value: boolean) => void;
	updateCategoryPosition: (
		section: 'eventCategories' | 'actionCategories',
		categoryId: number,
		x: number,
		y: number
	) => Promise<void>;
	updateCategoryName: (categoryId: number, categoryName: string) => Promise<void>;
	addButtonToCategory: (
		section: 'eventCategories' | 'actionCategories',
		categoryId: number,
		name: string
	) => Promise<void>;
	addCategory: (
		section: 'eventCategories' | 'actionCategories',
		name: string,
		color: string
	) => Promise<void>;
};
