import { Context, StateHistory } from 'runed';
import { v7 as uuidv7 } from 'uuid';
import { projectActions } from '../../persistence/stores/project/actions';
import { CategoryType } from '../../components/box/types';
import { feedbackMessages } from '../../utils/messages';
import { categoryValidationSchema, buttonValidationSchema } from './validationSchema';
import type { BoardData } from './types/Board';
import { BoardRepositoryFactory } from '../../factories/BoardRepositoryFactory';
import { emit } from '@tauri-apps/api/event';
import { wrapObjectForUndo } from '../../persistence/undo/UndoStateWrapper';
import { Scope } from '../../persistence/undo/types/Scope';
import type { Category } from './types/Category';
import type { Button } from './types/Button';
import type { Tag } from './types/Tag';

const initialState: BoardData = {
	[CategoryType.Event]: [],
	[CategoryType.Tag]: []
};

const initialCategory = (section: CategoryType): Category => ({
	id: uuidv7(),
	name: '',
	type: section,
	position: {
		x: 0,
		y: 0
	},
	buttons: [],
	color: '#000000'
});

export const boardContext = new Context<Board>('');

export class Board {
	#history!: StateHistory<BoardData>;
	#isEditing = $state(false);
	#tempCategory = $state<Category>(initialCategory(CategoryType.Event));
	#state = $state<BoardData>(initialState);
	#eventCategoriesById!: Record<string, Category>;
	#tagCategoriesById!: Record<string, Category>;
	#errorsForm = $state<Record<number | string, { message: string }>>({});
	#eventButtonsById!: Record<string, Button>;
	#tagsById!: Record<string, Tag>;

	constructor() {
		this.#history = new StateHistory<BoardData>(
			() => $state.snapshot(this.#state),
			(n) => (this.#state = n)
		);

		//#region Selector derived states
		this.#eventCategoriesById = $derived.by(() => {
			return this.#state[CategoryType.Event].reduce(
				(acc, category) => {
					acc[category.id] = category;
					return acc;
				},
				{} as Record<string, Category>
			);
		});

		this.#tagCategoriesById = $derived.by(() => {
			return this.#state[CategoryType.Tag].reduce(
				(acc, category) => {
					acc[category.id] = category;
					return acc;
				},
				{} as Record<string, Category>
			);
		});

		this.#eventButtonsById = $derived.by(() => {
			return this.#state[CategoryType.Event].reduce(
				(acc, category) => {
					category.buttons.forEach((button) => {
						acc[button.id] = button as Button;
					});
					return acc;
				},
				{} as Record<string, Button>
			);
		});

		this.#tagsById = $derived.by(() => {
			return this.#state[CategoryType.Tag].reduce(
				(acc, category) => {
					category.buttons.forEach((button) => {
						acc[button.id] = button as Tag;
					});
					return acc;
				},
				{} as Record<string, Tag>
			);
		});
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

	resetCategoryForm(section: CategoryType) {
		this.#tempCategory = initialCategory(section);
		this.resetErrorsForm();
	}

	resetErrorsForm() {
		this.#errorsForm = {};
	}

	async updateCategoryPosition(
		section: CategoryType,
		categoryId: string,
		x: number,
		y: number
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const cat = this.#state[section].find((c) => c.id === categoryId)!;

		cat.position = { x, y };

		await repository.updateCategory(cat);
		await emit('project:dirty');
	}

	async updateCategoryName(
		categoryId: string,
		section: CategoryType,
		categoryName: string
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const cat = this.#state[section].find((c) => c.id === categoryId);

		if (!cat) {
			return;
		}

		cat.name = categoryName;

		await repository.updateCategory(cat);
	}

	async addButtonToCategory(
		section: CategoryType,
		categoryId: string,
		button: Button | Tag
	): Promise<void> {
		const repository = BoardRepositoryFactory.getInstance();

		const currState = this.#state;

		const cat = currState[section].find((c) => c.id === categoryId);

		if (!cat) {
			return;
		}

		const buttonId =
			section === CategoryType.Event
				? await repository.addButtonToCategory(categoryId, button as Button)
				: await repository.addTagToCategory(categoryId, button as Tag);

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

		await emit('project:dirty');
	}

	async loadCategoryToAddOrEdit(section: CategoryType, categoryId?: string): Promise<void> {
		if (categoryId) {
			if (section === CategoryType.Event) {
				this.#tempCategory = $state.snapshot(this.eventCategoriesById[categoryId]);
			} else if (section === CategoryType.Tag) {
				this.#tempCategory = $state.snapshot(this.tagCategoriesById[categoryId]);
			}
		} else {
			this.resetCategoryForm(section);
		}
	}

	onValidateCategory(): Record<number | string, { message: string }> | void {
		const errorObject: Record<number | string, { message: string }> = {};

		for (const rule of categoryValidationSchema) {
			if (rule.validate(this.#tempCategory)) {
				if (rule.message.includes('button')) {
					errorObject['buttons'] = { message: rule.message };
				} else {
					errorObject['category'] = { message: rule.message };
				}
				break;
			}
		}

		this.#tempCategory.buttons.forEach((button: Button | Tag, idx: number) => {
			for (const rule of buttonValidationSchema) {
				if (rule.validate(button, idx, this.#tempCategory.buttons as Button[] | Tag[])) {
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

	async addOrUpdateCategory(section: CategoryType): Promise<void> {
		try {
			this.onValidateCategory();

			const repository = BoardRepositoryFactory.getInstance();

			const categoryExists = await repository.categoryExists(this.#tempCategory.id);

			if (categoryExists) {
				await this.updateCategory(section);
			} else {
				await this.addCategory();
			}
			return;
		} catch (error) {
			if (error === 'validation-failed') {
				return projectActions.setSnackbar(feedbackMessages.VALIDATION_ERROR);
			}

			return projectActions.setSnackbar({
				...feedbackMessages.ACTION_FAILED,
				message: error instanceof Error ? error.message : String(error)
			});
		}
	}

	async addCategory(): Promise<void> {
		try {
			const repository = BoardRepositoryFactory.getInstance();

			await repository.addCategory(this.#tempCategory);

			this.#state = {
				...this.#state,
				[this.#tempCategory.type]: [
					...this.#state[this.#tempCategory.type],
					{
						id: this.#tempCategory.id,
						type: this.#tempCategory.type,
						name: this.#tempCategory.name,
						color: this.#tempCategory.color,
						position: { x: 0, y: 0 },
						buttons: []
					}
				]
			};

			for (const button of this.#tempCategory.buttons) {
				await this.addButtonToCategory(this.#tempCategory.type, this.#tempCategory.id, button);
			}

			await emit('project:dirty');

			projectActions.closeAndResetModal();

			projectActions.setSnackbar(feedbackMessages.ACTION_SUCCESS);
			this.resetCategoryForm(this.#tempCategory.type);
		} catch (error) {
			projectActions.setSnackbar({
				...feedbackMessages.ACTION_FAILED,
				message: error instanceof Error ? error.message : String(error)
			});
		}
	}

	async updateCategory(section: CategoryType): Promise<void> {
		const category = this.#tempCategory;
		try {
			const repository = BoardRepositoryFactory.getInstance();

			await repository.updateCategory(category);

			if (section === CategoryType.Event) {
				await repository.updateCategoryButtons(category.id, category.buttons as Button[]);
			} else {
				await repository.updateCategoryTags(category.id, category.buttons as Tag[]);
			}

			this.#state = {
				...this.#state,
				[section]: this.#state[section].map(
					(c): Category =>
						c.id === category.id
							? {
									...c,
									name: category.name,
									color: category.color,
									buttons: category.buttons.map((b) => ({
										...b
									}))
								}
							: c
				)
			};
			await emit('project:dirty');

			projectActions.closeAndResetModal();

			projectActions.setSnackbar(feedbackMessages.UPDATE_SUCCESS);
			this.resetCategoryForm(section);
		} catch (error) {
			projectActions.setSnackbar({
				...feedbackMessages.ACTION_FAILED,
				message: error instanceof Error ? error.message : String(error)
			});
		}
	}

	async deleteCategory(section: CategoryType, categoryId: string): Promise<void> {
		// <!-- TODO: When deleting category, if there is already events created with this categoryId, we should delete them as well, setModal are you sure you want to erase -->
		try {
			const repository = BoardRepositoryFactory.getInstance();

			await repository.deleteCategory(categoryId);

			this.#state = {
				...this.#state,
				[section]: this.#state[section].filter((c) => c.id !== categoryId)
			};

			await emit('project:dirty');

			projectActions.setSnackbar(feedbackMessages.DELETE_SUCCESS);
		} catch (error) {
			projectActions.setSnackbar({
				...feedbackMessages.ACTION_FAILED,
				message: error instanceof Error ? error.message : String(error)
			});
		}
	}

	async loadBoard(boardData: BoardData): Promise<void> {
		const eventCategories = boardData[CategoryType.Event];
		const tagCategories = boardData[CategoryType.Tag];

		for (const category of [...eventCategories, ...tagCategories]) {
			this.#tempCategory = category;
			await this.addCategory();
		}
	}

	wrapForUndo() {
		Object.assign(
			this,
			wrapObjectForUndo(
				{
					updateCategoryName: this.updateCategoryName.bind(this),
					updateCategory: this.updateCategory.bind(this),
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

	get errorsForm() {
		return this.#errorsForm;
	}

	set categoryToCreate(value: Category) {
		this.#tempCategory = value;
	}

	get tagCategories() {
		return this.#state[CategoryType.Tag];
	}

	get eventCategories() {
		return this.#state[CategoryType.Event];
	}

	get eventCategoriesById() {
		return this.#eventCategoriesById;
	}

	get tagCategoriesById() {
		return this.#tagCategoriesById;
	}

	get eventButtonsById() {
		return this.#eventButtonsById;
	}

	get tagsById() {
		return this.#tagsById;
	}
	//#endregion
}
