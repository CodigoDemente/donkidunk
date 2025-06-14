import BoardStore from './store.svelte';

// Helper to generate unique IDs
function uuid() {
	return Math.random().toString(36).substring(2, 10) + Date.now();
}

export const boardActions = {
	setEditingMode(value: boolean) {
		BoardStore.isEditing = value;
	},

	updateCategoryPosition(
		section: 'eventCategories' | 'actionCategories',
		categoryId: string,
		x: number,
		y: number
	) {
		const cat = BoardStore[section].find((c) => c.id === categoryId);

		if (cat) {
			cat.onGrid = [x, y];
		}
	},

	addButtonToCategory(
		section: 'eventCategories' | 'actionCategories',
		categoryId: string,
		name: string
	) {
		const cat = BoardStore[section].find((c) => c.id === categoryId);

		if (cat) {
			cat.buttons.push({
				id: `${categoryId}-${uuid()}`,
				name: name
			});
		}
	},

	addCategory(section: 'eventCategories' | 'actionCategories', name: string, color: string) {
		BoardStore[section].push({
			id: uuid(),
			name: name,
			color: color,
			onGrid: [0, 0],
			buttons: []
		});
	}
};
