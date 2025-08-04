import { Context, StateHistory } from 'runed';
import type { BoardData } from './types/Board';
import { BoardRepositoryFactory } from '../../factories/BoardRepositoryFactory';
import { emit } from '@tauri-apps/api/event';
import { wrapObjectForUndo } from '../../persistence/undo/UndoStateWrapper';
import { Scope } from '../../persistence/undo/types/Scope';
import type { Category } from './types/Category';
import type { Tag } from './types/Tag';
import type { Action } from './types/Action';

const initialState: BoardData = {
	isEditing: false,
	eventCategories: [],
	tagsRelatedToEvents: [],
	actionCategories: []
};

export const boardContext = new Context<Board>('');

export class Board {
	#history!: StateHistory<BoardData>;
	#state = $state<BoardData>(initialState);
	#eventCategoriesById!: Record<string, Category>;
	#actionCategoriesById!: Record<string, Category>;
	#tagsById!: Record<string, Tag>;
	#eventButtonsById!: Record<string, Action>;
	#actionButtonsById!: Record<string, Action>;

	constructor() {
		this.#history = new StateHistory<BoardData>(
			() => $state.snapshot(this.#state),
			(n) => (this.#state = n)
		);

		//#region Selector derived states
		this.#eventCategoriesById = $derived.by(() => {
			return this.#state.eventCategories.reduce(
				(acc, category) => {
					acc[category.id] = category;
					return acc;
				},
				{} as Record<string, Category>
			);
		});

		this.#actionCategoriesById = $derived.by(() => {
			return this.#state.actionCategories.reduce(
				(acc, category) => {
					acc[category.id] = category;
					return acc;
				},
				{} as Record<string, Category>
			);
		});

		this.#tagsById = $derived.by(() => {
			return this.#state.tagsRelatedToEvents.reduce(
				(acc, tag) => {
					acc[tag.id] = tag;
					return acc;
				},
				{} as Record<string, Tag>
			);
		});

		this.#eventButtonsById = $derived.by(() => {
			return this.#state.eventCategories.reduce(
				(acc, category) => {
					category.buttons.forEach((button) => {
						acc[button.id] = button;
					});
					return acc;
				},
				{} as Record<string, Action>
			);
		});

		this.#actionButtonsById = $derived.by(() => {
			return this.#state.actionCategories.reduce(
				(acc, category) => {
					category.buttons.forEach((button) => {
						acc[button.id] = button;
					});
					return acc;
				},
				{} as Record<string, Action>
			);
		});
		//#endregion
	}

	getState() {
		return this.#state;
	}

	reset() {
		this.#state = initialState;
	}

	canUndo() {
		return this.#history.canUndo;
	}

	canRedo() {
		return this.#history.canRedo;
	}

	undo() {
		this.#history.undo();
	}

	redo() {
		this.#history.redo();
	}

	//#region Actions
	setEditingMode(value: boolean) {
		this.#state.isEditing = value;
	}

	async updateCategoryPosition(
		section: 'eventCategories' | 'actionCategories',
		categoryId: number,
		x: number,
		y: number
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const cat = this.#state[section].find((c) => c.id === categoryId);

		if (cat) {
			cat.onGrid = [x, y];
		}

		await repository.updateCategoryPosition(categoryId, x, y);
		await emit('project:dirty');
	}

	async updateCategoryName(categoryId: number, categoryName: string): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		await repository.updateCategoryName(categoryId, categoryName);

		await emit('project:dirty');
	}

	async addButtonToCategory(
		section: 'eventCategories' | 'actionCategories',
		categoryId: number,
		name: string
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const currState = this.#state;

		const cat = currState[section].find((c) => c.id === categoryId);

		if (cat) {
			const res = await repository.addButtonToCategory(categoryId, name);

			cat.buttons.push({
				id: res,
				name: name
			});
		}

		await emit('project:dirty');
	}

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

		this.#state[section].push({
			id: res,
			name: name,
			color: color,
			onGrid: [0, 0],
			buttons: []
		});

		await emit('project:dirty');
	}

	wrapForUndo() {
		Object.assign(
			this,
			wrapObjectForUndo(
				{
					setEditingMode: this.setEditingMode.bind(this),
					updateCategoryName: this.updateCategoryName.bind(this),
					addButtonToCategory: this.addButtonToCategory.bind(this),
					addCategory: this.addCategory.bind(this)
				},
				Scope.Board
			)
		);

		return this;
	}
	//#endregion

	//#region Selectors
	get eventCategoriesById() {
		return this.#eventCategoriesById;
	}

	get actionCategoriesById() {
		return this.#actionCategoriesById;
	}

	get tagsById() {
		return this.#tagsById;
	}

	get eventButtonsById() {
		return this.#eventButtonsById;
	}

	get actionButtonsById() {
		return this.#actionButtonsById;
	}
	//#endregion
}
