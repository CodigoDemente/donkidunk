import { emit } from '@tauri-apps/api/event';
import { BoardRepositoryFactory } from '../../../factories/BoardRepositoryFactory';
import BoardStore, { categoryState } from './store.svelte';
import type { Button } from './types/Button';

const boardStore = BoardStore.state;

export const boardActions = {
	setEditingMode(value: boolean) {
		boardStore.isEditing = value;
	},

	resetCategoryForm() {
		boardStore.category = { ...categoryState };
	},

	async updateCategoryPosition(
		section: 'eventCategories' | 'actionCategories',
		categoryId: number,
		x: number,
		y: number
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const cat = boardStore[section].find((c) => c.id === categoryId);

		if (cat) {
			cat.position = { x, y };
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
		button: Button
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const cat = boardStore[section].find((c) => c.id === categoryId);

		const resId = await repository.addButtonToCategory(categoryId, button);

		if (cat) {
			cat.buttons.push({
				id: resId,
				...button
			});
		}

		await emit('project:dirty');
	},

	async addCategory(section: 'eventCategories' | 'actionCategories'): Promise<void> {
		try {
			const { name, color, buttons } = boardStore.category;
			const repository = BoardRepositoryFactory.getInstance();

			const resId = await repository.addCategory(
				section === 'eventCategories' ? 'event' : 'action',
				name,
				color
			);
			boardStore[section].push({
				id: resId,
				name: name,
				color: color,
				position: { x: 0, y: 0 },
				buttons: []
			});

			for (const button of buttons) {
				await boardActions.addButtonToCategory(section, resId, button);
			}

			await emit('project:dirty');

			boardActions.resetCategoryForm();
		} catch (error) {
			//TODO: REUSABLE SNACKBAR ERROR TO CREATE;
			console.error('Error adding category:', error);
		}
	}
};
