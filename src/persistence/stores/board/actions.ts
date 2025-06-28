import { emit } from '@tauri-apps/api/event';
import { BoardRepositoryFactory } from '../../../factories/BoardRepositoryFactory';
import BoardStore from './store.svelte';

export const boardActions = {
	setEditingMode(value: boolean) {
		BoardStore.isEditing = value;
	},

	async updateCategoryPosition(
		section: 'eventCategories' | 'actionCategories',
		categoryId: number,
		x: number,
		y: number
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const cat = BoardStore[section].find((c) => c.id === categoryId);

		if (cat) {
			cat.onGrid = [x, y];
		}

		await repository.updateCategoryPosition(categoryId, x, y);
		await emit('project:dirty');
	},

	async updateCategoryName(categoryId: number, categoryName: string): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		await repository.updateCategoryName(categoryId, categoryName);

		await emit('project:dirty');
	},

	async addButtonToCategory(
		section: 'eventCategories' | 'actionCategories',
		categoryId: number,
		name: string
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const cat = BoardStore[section].find((c) => c.id === categoryId);

		const res = await repository.addButtonToCategory(categoryId, name);

		if (cat) {
			cat.buttons.push({
				id: res,
				name: name
			});
		}

		await emit('project:dirty');
	},

	async addCategory(
		section: 'eventCategories' | 'actionCategories',
		name: string,
		color: string
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const res = await repository.addCategory(
			section === 'eventCategories' ? 'event' : 'action',
			name,
			color
		);

		BoardStore[section].push({
			id: res,
			name: name,
			color: color,
			onGrid: [0, 0],
			buttons: []
		});

		await emit('project:dirty');
	}
};
