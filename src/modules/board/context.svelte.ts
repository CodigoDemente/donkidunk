import { Context, StateHistory } from 'runed';
import type { BoardData } from './types/Board';
import { BoardRepositoryFactory } from '../../factories/BoardRepositoryFactory';
import { emit } from '@tauri-apps/api/event';
import { wrapObjectForUndo } from '../../persistence/undo/UndoStateWrapper';
import { Scope } from '../../persistence/undo/types/Scope';
import type { Category } from './types/Category';
import type { Tag } from './types/Tag';
import type { Button } from './types/Button';
import { projectActions } from '../../persistence/stores/project/actions';

const initialState: BoardData = {
	eventCategories: [],
	tagsRelatedToEvents: [],
	actionCategories: []
};

const initialCategory: Category = {
	id: 0,
	name: '',
	position: {
		x: 0,
		y: 0
	},
	buttons: [],
	color: '#000000'
};

export const boardContext = new Context<Board>('');

export class Board {
	#history!: StateHistory<BoardData>;
	#isEditing = $state(false);
	#tempCategory = $state<Category>(initialCategory);
	#tempTagsList = $state<Tag[]>([]);
	#state = $state<BoardData>(initialState);
	#eventCategoriesById!: Record<string, Category>;
	#actionCategoriesById!: Record<string, Category>;
	#tagsById!: Record<string, Tag>;
	#errorsForm = $state<Record<number, { message: string }>>({});
	#eventButtonsById!: Record<string, Button>;
	#actionButtonsById!: Record<string, Button>;

	constructor() {
		this.#history = new StateHistory<BoardData>(
			() => $state.snapshot(this.#state),
			(n) => (this.#state = n)
		);

		//#region Selector derived states
		this.#eventCategoriesById = $derived.by(() => {
			return this.#state.eventCategories.reduce(
				(acc, category) => {
					acc[category.id!] = category;
					return acc;
				},
				{} as Record<string, Category>
			);
		});

		this.#actionCategoriesById = $derived.by(() => {
			return this.#state.actionCategories.reduce(
				(acc, category) => {
					acc[category.id!] = category;
					return acc;
				},
				{} as Record<string, Category>
			);
		});

		// this.#tagsById = $derived.by(() => {
		// 	return this.#state.tagsRelatedToEvents.reduce(
		// 		(acc, tag) => {
		// 			acc[tag.id] = tag;
		// 			return acc;
		// 		},
		// 		{} as Record<string, Tag>
		// 	);
		// });

		this.#eventButtonsById = $derived.by(() => {
			return this.#state.eventCategories.reduce(
				(acc, category) => {
					category.buttons.forEach((button) => {
						acc[button.id!] = button;
					});
					return acc;
				},
				{} as Record<string, Button>
			);
		});

		this.#actionButtonsById = $derived.by(() => {
			return this.#state.actionCategories.reduce(
				(acc, category) => {
					category.buttons.forEach((button) => {
						acc[button.id!] = button;
					});
					return acc;
				},
				{} as Record<string, Button>
			);
		});
		//#endregion
	}

	getState() {
		return this.#state;
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
	reset() {
		this.#state = initialState;
	}

	setEditingMode(value: boolean) {
		this.#isEditing = value;
	}

	resetCategoryForm() {
		this.#tempCategory = initialCategory;
	}

	resetErrorsForm() {
		this.#errorsForm = {};
	}

	resetTagsListForm() {
		this.#tempTagsList = [];
		this.resetErrorsForm();
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
			cat.position = { x, y };
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
		button: Button
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const currState = this.#state;

		const cat = currState[section].find((c) => c.id === categoryId);

		if (cat) {
			const buttonId = await repository.addButtonToCategory(categoryId, button);

			this.#state = {
				...this.#state,
				[section]: this.#state[section].map((c) => {
					if (c.id === categoryId) {
						return {
							...c,
							buttons: [
								...c.buttons,
								{
									...button,
									id: buttonId
								}
							]
						};
					}
					return c;
				})
			};
		}

		await emit('project:dirty');
	}

	async addCategory(section: 'eventCategories' | 'actionCategories'): Promise<void> {
		try {
			const { name, color, buttons } = this.#tempCategory;

			const repository = BoardRepositoryFactory.getInstance();

			const categoryId = await repository.addCategory(
				section === 'eventCategories' ? 'event' : 'action',
				name,
				color
			);

			this.#state = {
				...this.#state,
				[section]: [
					...this.#state[section],
					{
						id: categoryId,
						name: name,
						color: color,
						position: { x: 0, y: 0 },
						buttons: []
					}
				]
			};

			for (const button of buttons) {
				await this.addButtonToCategory(section, categoryId, button);
			}

			await emit('project:dirty');

			projectActions.closeAndResetModal();
			// TODO: Show success snackbar
			console.log('Category added successfully');
			this.resetCategoryForm();
		} catch (error) {
			//TODO: REUSABLE SNACKBAR ERROR TO CREATE;
			console.error('Error adding category:', error);
		}
	}

	onValidateTagsList(): Record<number, { message: string }> | void {
		const errorObject: Record<number, { message: string }> = {};

		const validationSchema = [
			{
				validate: (tag: Tag) => tag.name.trim() === '',
				message: 'Tag name cannot be empty'
			},
			{
				validate: (tag: Tag, idx: number, tags: Tag[]) => {
					const name = tag.name.trim().toLowerCase();
					return (
						name &&
						tags.filter((t, i) => t.name.trim().toLowerCase() === name && i !== idx).length > 0
					);
				},
				message: 'Tag names must be unique'
			}
		];

		this.#tempTagsList.forEach((tag, idx, tags) => {
			for (const rule of validationSchema) {
				if (rule.validate(tag, idx, tags)) {
					errorObject[idx] = { message: rule.message };
					break;
				}
			}
		});

		if (Object.keys(errorObject).length > 0) {
			this.#errorsForm = errorObject;
			throw 'validation-failed';
		}

		return this.resetErrorsForm();
	}

	async addTagsList(): Promise<void> {
		try {
			const section = 'tagsRelatedToEvents';
			const tags = this.#tempTagsList;

			await this.onValidateTagsList();

			const repository = BoardRepositoryFactory.getInstance();

			const result = await repository.addTagsList(tags);

			this.#state = {
				...this.#state,
				[section]: [...result]
			};

			await emit('project:dirty');

			projectActions.closeAndResetModal();
			// TODO: Show success snackbar
			console.log('Tags added successfully');
			this.resetTagsListForm();
		} catch (error) {
			//TODO: REUSABLE SNACKBAR ERROR TO CREATE;
			console.error('Error adding tag list:', error);
		}
	}

	wrapForUndo() {
		Object.assign(
			this,
			wrapObjectForUndo(
				{
					updateCategoryName: this.updateCategoryName.bind(this),
					addButtonToCategory: this.addButtonToCategory.bind(this),
					addCategory: this.addCategory.bind(this),
					updateCategoryPosition: this.updateCategoryPosition.bind(this)
				},
				Scope.Board
			)
		);

		return this;
	}
	//#endregion

	//#region Selectors
	get isEditing() {
		return this.#isEditing;
	}

	get categoryToCreate() {
		return this.#tempCategory;
	}

	get tagsListToCreate() {
		return this.#tempTagsList;
	}

	get errorsForm() {
		return this.#errorsForm;
	}

	get actionCategories() {
		return this.#state.actionCategories;
	}

	get actionCategoriesById() {
		return this.#actionCategoriesById;
	}

	get eventCategories() {
		return this.#state.eventCategories;
	}

	get eventCategoriesById() {
		return this.#eventCategoriesById;
	}

	get tagsRelatedToEvents() {
		return this.#state.tagsRelatedToEvents;
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
