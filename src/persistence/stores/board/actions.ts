import { emit } from '@tauri-apps/api/event';
import { BoardRepositoryFactory } from '../../../factories/BoardRepositoryFactory';
import BoardStore from './store.svelte';
import { v4 as uuidv4 } from 'uuid';

export const boardActions = {
	setEditingMode(value: boolean) {
		BoardStore.isEditing = value;
	},

	async updateCategoryPosition(
		section: 'eventCategories' | 'actionCategories',
		categoryId: string,
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

	async updateCategoryName(categoryId: string, categoryName: string): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		await repository.updateCategoryName(categoryId, categoryName);

		await emit('project:dirty');
	},

	async addButtonToCategory(
		section: 'eventCategories' | 'actionCategories',
		categoryId: string,
		name: string
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const cat = BoardStore[section].find((c) => c.id === categoryId);

		if (cat) {
			cat.buttons.push({
				id: `${categoryId}-${uuidv4()}`,
				name: name
			});
		}

		await repository.addButtonToCategory(categoryId, name);
		await emit('project:dirty');
	},

	async addCategory(
		section: 'eventCategories' | 'actionCategories',
		name: string,
		color: string
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		BoardStore[section].push({
			id: uuidv4(),
			name: name,
			color: color,
			onGrid: [0, 0],
			buttons: []
		});

		await repository.addCategory(section === 'eventCategories' ? 'event' : 'action', name, color);
		await emit('project:dirty');
	}
};
