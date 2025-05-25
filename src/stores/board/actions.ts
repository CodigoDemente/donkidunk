import { boardStore } from './store';

// Helper to generate unique IDs
function uuid() {
	return Math.random().toString(36).substring(2, 10) + Date.now();
}

export const boardActions = {
	setEditingMode(value: boolean) {
		boardStore.update((state) => {
			state.isEditing = value;
			return state;
		});
	},

	updateCategoryPosition(
		section: 'eventCategories' | 'actionCategories',
		categoryId: string,
		x: number,
		y: number
	) {
		boardStore.update((state) => {
			const cat = state[section].find((c) => c.id === categoryId);
			if (cat) {
				cat.onGrid = [x, y];
			}
			return state;
		});
	},

	addButtonToCategory(
		section: 'eventCategories' | 'actionCategories',
		categoryId: string,
		name: string
	) {
		boardStore.update((state) => {
			const cat = state[section].find((c) => c.id === categoryId);
			if (cat) {
				cat.buttons.push({
					id: `${categoryId}-${uuid()}`,
					name: name
				});
			}
			return state;
		});
	},

	addCategory(section: 'eventCategories' | 'actionCategories', name: string, color: string) {
		boardStore.update((state) => {
			state[section].push({
				id: uuid(),
				name: name,
				color: color,
				onGrid: [0, 0],
				buttons: []
			});
			return state;
		});
	}
};
