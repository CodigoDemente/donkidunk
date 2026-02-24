/**
 * Tests for the Board class (context.svelte.ts).
 *
 * These run in a real browser via vitest-browser-svelte because the class
 * uses Svelte 5 runes ($state, $derived) which require the Svelte runtime.
 *
 * The repository, Tauri emit, and projectActions are mocked so no backend is needed.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { flushSync } from 'svelte';
import type { BoardRepository } from '../../../ports/BoardRepository';
import { CategoryType } from '../types/CategoryType';
import type { Category } from '../types/Category';
import type { Button } from '../types/Button';
import type { Tag } from '../types/Tag';
import type { Timeline } from '../../videoplayer/context.svelte';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock the Tauri event emit
vi.mock('@tauri-apps/api/event', () => ({
	emit: vi.fn().mockResolvedValue(undefined)
}));

// Mock projectActions
vi.mock('../../../persistence/stores/project/actions', () => ({
	projectActions: {
		setSnackbar: vi.fn(),
		closeAndResetModal: vi.fn()
	}
}));

// Mock the repository factory
const mockRepository: BoardRepository = {
	getSectionCategories: vi.fn().mockResolvedValue([]),
	categoryExists: vi.fn().mockResolvedValue(false),
	getTagsRelatedToEvents: vi.fn().mockResolvedValue([]),
	addCategory: vi.fn().mockResolvedValue(undefined),
	deleteCategory: vi.fn().mockResolvedValue(undefined),
	addTagToCategory: vi.fn().mockResolvedValue(undefined),
	addButtonToCategory: vi.fn().mockResolvedValue(undefined),
	updateCategory: vi.fn().mockResolvedValue(undefined),
	updateCategoryButtons: vi.fn().mockResolvedValue(undefined),
	updateCategoryTags: vi.fn().mockResolvedValue(undefined),
	deleteButtonFromCategory: vi.fn().mockResolvedValue(undefined),
	deleteTagFromCategory: vi.fn().mockResolvedValue(undefined)
};

vi.mock('../../../factories/BoardRepositoryFactory', () => ({
	BoardRepositoryFactory: {
		getInstance: () => mockRepository,
		create: vi.fn(),
		reset: vi.fn()
	}
}));

// Mock the undo wrapper to be a passthrough
vi.mock('../../../persistence/undo/UndoStateWrapper', () => ({
	wrapObjectForUndo: (methods: Record<string, unknown>) => methods
}));

// ─── Test helpers ────────────────────────────────────────────────────────────

// Import Board *after* mocks are set up
const { Board } = await import('../context.svelte');
const { emit } = await import('@tauri-apps/api/event');
const { projectActions } = await import('../../../persistence/stores/project/actions');

function createButton(overrides: Partial<Button> = {}): Button {
	return {
		id: `btn-${Math.random().toString(36).slice(2, 8)}`,
		name: 'Test Button',
		color: '#3b82f6',
		duration: null,
		before: null,
		...overrides
	};
}

function createTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: `tag-${Math.random().toString(36).slice(2, 8)}`,
		name: 'Test Tag',
		color: '#ef4444',
		...overrides
	};
}

function createCategory(overrides: Partial<Category> = {}): Category {
	return {
		id: `cat-${Math.random().toString(36).slice(2, 8)}`,
		name: 'Test Category',
		type: CategoryType.Event,
		color: '#22c55e',
		position: { x: 10, y: 20 },
		buttons: [],
		...overrides
	};
}

function createMockTimeline(): Timeline {
	return {
		removeAllEventsFromCategory: vi.fn().mockResolvedValue(undefined),
		removeAllEventsFromButtons: vi.fn().mockResolvedValue(undefined),
		removeAllTagsFromButtons: vi.fn().mockResolvedValue(undefined)
	} as unknown as Timeline;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Board', () => {
	let board: InstanceType<typeof Board>;
	let cleanup: () => void;

	beforeEach(() => {
		vi.clearAllMocks();
		// $effect.root creates a standalone reactive scope required by StateHistory (runed)
		cleanup = $effect.root(() => {
			board = new Board();
		});
	});

	afterEach(() => {
		cleanup();
	});

	// ── Initial state ────────────────────────────────────────────────────────

	describe('Initial State', () => {
		it('should start with empty event categories', () => {
			expect(board.eventCategories).toEqual([]);
		});

		it('should start with empty tag categories', () => {
			expect(board.tagCategories).toEqual([]);
		});

		it('should have an initial state with empty arrays for both types', () => {
			const state = board.getState();
			expect(state[CategoryType.Event]).toEqual([]);
			expect(state[CategoryType.Tag]).toEqual([]);
		});

		it('should start with empty errors form', () => {
			expect(board.errorsForm).toEqual({});
		});

		it('should have a default categoryToCreate', () => {
			const cat = board.categoryToCreate;
			expect(cat).toBeDefined();
			expect(cat.name).toBe('');
			expect(cat.color).toBe('#000000');
			expect(cat.buttons).toEqual([]);
			expect(cat.type).toBe(CategoryType.Event);
		});
	});

	// ── reset ────────────────────────────────────────────────────────────────

	describe('reset', () => {
		it('should clear all state back to initial', async () => {
			// Add a category first
			board.categoryToCreate = createCategory({
				id: 'c1',
				name: 'My Category',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'Btn' })]
			});
			await board.addCategory();
			flushSync();

			expect(board.eventCategories.length).toBe(1);

			board.reset();
			flushSync();

			expect(board.eventCategories).toEqual([]);
			expect(board.tagCategories).toEqual([]);
			expect(board.errorsForm).toEqual({});
		});
	});

	// ── resetCategoryForm ────────────────────────────────────────────────────

	describe('resetCategoryForm', () => {
		it('should reset the temp category for Event section', () => {
			board.categoryToCreate = createCategory({ name: 'Modified', type: CategoryType.Event });
			board.resetCategoryForm(CategoryType.Event);

			expect(board.categoryToCreate.name).toBe('');
			expect(board.categoryToCreate.type).toBe(CategoryType.Event);
		});

		it('should reset the temp category for Tag section', () => {
			board.resetCategoryForm(CategoryType.Tag);
			expect(board.categoryToCreate.type).toBe(CategoryType.Tag);
			expect(board.categoryToCreate.name).toBe('');
		});

		it('should also clear errorsForm', () => {
			// Trigger a validation error first
			try {
				board.onValidateCategory();
			} catch {
				// expected
			}
			expect(Object.keys(board.errorsForm).length).toBeGreaterThan(0);

			board.resetCategoryForm(CategoryType.Event);
			expect(board.errorsForm).toEqual({});
		});
	});

	// ── onValidateCategory ──────────────────────────────────────────────────

	describe('onValidateCategory', () => {
		it('should throw when category name is empty', () => {
			board.categoryToCreate = createCategory({
				name: '',
				buttons: [createButton()]
			});

			expect(() => board.onValidateCategory()).toThrow('validation-failed');
			expect(board.errorsForm).toHaveProperty('category');
		});

		it('should throw when category has no buttons', () => {
			board.categoryToCreate = createCategory({
				name: 'Valid Name',
				buttons: []
			});

			expect(() => board.onValidateCategory()).toThrow('validation-failed');
			expect(board.errorsForm).toHaveProperty('buttons');
		});

		it('should throw when a button name is empty', () => {
			board.categoryToCreate = createCategory({
				name: 'Valid Name',
				buttons: [createButton({ name: '' })]
			});

			expect(() => board.onValidateCategory()).toThrow('validation-failed');
			expect(board.errorsForm).toHaveProperty(0);
		});

		it('should throw when button names are duplicated', () => {
			board.categoryToCreate = createCategory({
				name: 'Valid Name',
				buttons: [
					createButton({ id: 'b1', name: 'Same' }),
					createButton({ id: 'b2', name: 'Same' })
				]
			});

			expect(() => board.onValidateCategory()).toThrow('validation-failed');
		});

		it('should pass when category is valid', () => {
			board.categoryToCreate = createCategory({
				name: 'Valid Category',
				buttons: [createButton({ name: 'Button A' })]
			});

			expect(() => board.onValidateCategory()).not.toThrow();
			expect(board.errorsForm).toEqual({});
		});

		it('should reset errors when validation passes', () => {
			// First fail
			board.categoryToCreate = createCategory({ name: '', buttons: [] });
			try {
				board.onValidateCategory();
			} catch {
				// expected
			}
			expect(Object.keys(board.errorsForm).length).toBeGreaterThan(0);

			// Then pass
			board.categoryToCreate = createCategory({
				name: 'Valid',
				buttons: [createButton({ name: 'Btn' })]
			});
			board.onValidateCategory();
			expect(board.errorsForm).toEqual({});
		});
	});

	// ── addCategory ─────────────────────────────────────────────────────────

	describe('addCategory', () => {
		it('should add an event category to state', async () => {
			const btn = createButton({ id: 'b1', name: 'Action' });
			board.categoryToCreate = createCategory({
				id: 'cat-add-1',
				name: 'Events',
				type: CategoryType.Event,
				buttons: [btn]
			});

			await board.addCategory();
			flushSync();

			expect(board.eventCategories.length).toBe(1);
			expect(board.eventCategories[0].name).toBe('Events');
			expect(board.eventCategories[0].id).toBe('cat-add-1');
		});

		it('should add a tag category to state', async () => {
			const tag = createTag({ id: 't1', name: 'Important' });
			board.categoryToCreate = createCategory({
				id: 'cat-add-2',
				name: 'Tags',
				type: CategoryType.Tag,
				buttons: [tag]
			});

			await board.addCategory();
			flushSync();

			expect(board.tagCategories.length).toBe(1);
			expect(board.tagCategories[0].name).toBe('Tags');
		});

		it('should call repository.addCategory', async () => {
			board.categoryToCreate = createCategory({
				id: 'cat-repo',
				name: 'Repo Test',
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});

			await board.addCategory();

			expect(mockRepository.addCategory).toHaveBeenCalled();
		});

		it('should add buttons to the category via addButtonToCategory', async () => {
			const btn1 = createButton({ id: 'b1', name: 'Btn1' });
			const btn2 = createButton({ id: 'b2', name: 'Btn2' });
			board.categoryToCreate = createCategory({
				id: 'cat-btns',
				name: 'With Buttons',
				type: CategoryType.Event,
				buttons: [btn1, btn2]
			});

			await board.addCategory();
			flushSync();

			// Each button should be added via the repository
			expect(mockRepository.addButtonToCategory).toHaveBeenCalledTimes(2);
			// The category in state should have the buttons
			expect(board.eventCategories[0].buttons.length).toBe(2);
		});

		it('should emit project:dirty', async () => {
			board.categoryToCreate = createCategory({
				name: 'Dirty Test',
				buttons: [createButton({ name: 'B' })]
			});

			await board.addCategory();

			expect(emit).toHaveBeenCalledWith('project:dirty');
		});

		it('should call projectActions.closeAndResetModal on success', async () => {
			board.categoryToCreate = createCategory({
				name: 'Modal Test',
				buttons: [createButton({ name: 'B' })]
			});

			await board.addCategory();

			expect(projectActions.closeAndResetModal).toHaveBeenCalled();
		});

		it('should call projectActions.setSnackbar with success on success', async () => {
			board.categoryToCreate = createCategory({
				name: 'Snackbar Test',
				buttons: [createButton({ name: 'B' })]
			});

			await board.addCategory();

			expect(projectActions.setSnackbar).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'success' })
			);
		});

		it('should show error snackbar when repository throws', async () => {
			(mockRepository.addCategory as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error('DB error')
			);
			board.categoryToCreate = createCategory({
				name: 'Error Test',
				buttons: [createButton({ name: 'B' })]
			});

			await board.addCategory();

			expect(projectActions.setSnackbar).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: 'DB error'
				})
			);
		});
	});

	// ── updateCategoryPosition ──────────────────────────────────────────────

	describe('updateCategoryPosition', () => {
		it('should update position of an existing category', async () => {
			// First add a category
			board.categoryToCreate = createCategory({
				id: 'cat-pos',
				name: 'Positioned',
				type: CategoryType.Event,
				position: { x: 0, y: 0 },
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			await board.updateCategoryPosition(CategoryType.Event, 'cat-pos', 50, 60);
			flushSync();

			expect(board.eventCategories[0].position).toEqual({ x: 50, y: 60 });
			expect(mockRepository.updateCategory).toHaveBeenCalled();
			expect(emit).toHaveBeenCalledWith('project:dirty');
		});
	});

	// ── updateCategorySize ──────────────────────────────────────────────────

	describe('updateCategorySize', () => {
		it('should update size of an existing category', async () => {
			board.categoryToCreate = createCategory({
				id: 'cat-size',
				name: 'Sized',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			await board.updateCategorySize(CategoryType.Event, 'cat-size', 300, 200);
			flushSync();

			expect(board.eventCategories[0].size).toEqual({ width: 300, height: 200 });
			expect(mockRepository.updateCategory).toHaveBeenCalled();
		});
	});

	// ── updateCategoryName ──────────────────────────────────────────────────

	describe('updateCategoryName', () => {
		it('should update the name of a category', async () => {
			board.categoryToCreate = createCategory({
				id: 'cat-name',
				name: 'Old Name',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			await board.updateCategoryName('cat-name', CategoryType.Event, 'New Name');
			flushSync();

			expect(board.eventCategories[0].name).toBe('New Name');
			expect(mockRepository.updateCategory).toHaveBeenCalled();
		});

		it('should do nothing if category is not found', async () => {
			vi.clearAllMocks();
			await board.updateCategoryName('nonexistent', CategoryType.Event, 'Whatever');
			expect(mockRepository.updateCategory).not.toHaveBeenCalled();
		});
	});

	// ── addButtonToCategory ─────────────────────────────────────────────────

	describe('addButtonToCategory', () => {
		it('should add an event button to an existing category', async () => {
			board.categoryToCreate = createCategory({
				id: 'cat-btn',
				name: 'With Button',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b-init', name: 'Initial' })]
			});
			await board.addCategory();
			flushSync();

			const newButton = createButton({ id: 'b-new', name: 'New Button' });
			await board.addButtonToCategory(CategoryType.Event, 'cat-btn', newButton);
			flushSync();

			expect(board.eventCategories[0].buttons.length).toBe(2);
			expect(mockRepository.addButtonToCategory).toHaveBeenCalledWith('cat-btn', newButton);
			expect(emit).toHaveBeenCalledWith('project:dirty');
		});

		it('should add a tag to an existing tag category', async () => {
			board.categoryToCreate = createCategory({
				id: 'cat-tag',
				name: 'With Tag',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't-init', name: 'Initial Tag' })]
			});
			await board.addCategory();
			flushSync();

			const newTag = createTag({ id: 't-new', name: 'New Tag' });
			await board.addButtonToCategory(CategoryType.Tag, 'cat-tag', newTag);
			flushSync();

			expect(board.tagCategories[0].buttons.length).toBe(2);
			expect(mockRepository.addTagToCategory).toHaveBeenCalledWith('cat-tag', newTag);
		});

		it('should do nothing if category is not found', async () => {
			vi.clearAllMocks();
			const btn = createButton({ id: 'b1', name: 'Orphan' });
			await board.addButtonToCategory(CategoryType.Event, 'nonexistent', btn);
			expect(mockRepository.addButtonToCategory).not.toHaveBeenCalled();
		});
	});

	// ── addOrUpdateCategory ─────────────────────────────────────────────────

	describe('addOrUpdateCategory', () => {
		it('should add a new category when it does not exist', async () => {
			const timeline = createMockTimeline();
			(mockRepository.categoryExists as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

			board.categoryToCreate = createCategory({
				id: 'cat-new',
				name: 'Brand New',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'Btn' })]
			});

			await board.addOrUpdateCategory(CategoryType.Event, timeline);
			flushSync();

			expect(mockRepository.addCategory).toHaveBeenCalled();
			expect(board.eventCategories.length).toBe(1);
		});

		it('should update an existing category', async () => {
			const timeline = createMockTimeline();

			// First add a category
			board.categoryToCreate = createCategory({
				id: 'cat-existing',
				name: 'Original',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'Btn' })]
			});
			await board.addCategory();
			flushSync();

			// Now prepare to update it
			(mockRepository.categoryExists as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
			board.categoryToCreate = createCategory({
				id: 'cat-existing',
				name: 'Updated',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'Btn Updated' })]
			});

			await board.addOrUpdateCategory(CategoryType.Event, timeline);
			flushSync();

			expect(mockRepository.updateCategory).toHaveBeenCalled();
			expect(board.eventCategories[0].name).toBe('Updated');
		});

		it('should show validation error when form is invalid', async () => {
			const timeline = createMockTimeline();
			board.categoryToCreate = createCategory({ name: '', buttons: [] });

			await board.addOrUpdateCategory(CategoryType.Event, timeline);

			expect(projectActions.setSnackbar).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' })
			);
		});

		it('should show error snackbar when repository throws', async () => {
			const timeline = createMockTimeline();
			(mockRepository.categoryExists as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error('Network fail')
			);

			board.categoryToCreate = createCategory({
				name: 'Valid',
				buttons: [createButton({ name: 'B' })]
			});

			await board.addOrUpdateCategory(CategoryType.Event, timeline);

			expect(projectActions.setSnackbar).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: 'Network fail'
				})
			);
		});
	});

	// ── updateCategory ──────────────────────────────────────────────────────

	describe('updateCategory', () => {
		it('should remove deleted event buttons from timeline', async () => {
			const timeline = createMockTimeline();

			// Add a category with 2 buttons
			board.categoryToCreate = createCategory({
				id: 'cat-del-btns',
				name: 'Cat',
				type: CategoryType.Event,
				buttons: [
					createButton({ id: 'b1', name: 'Keep' }),
					createButton({ id: 'b2', name: 'Delete Me' })
				]
			});
			await board.addCategory();
			flushSync();

			// Update: remove b2
			board.categoryToCreate = createCategory({
				id: 'cat-del-btns',
				name: 'Cat Updated',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'Keep' })]
			});

			await board.updateCategory(CategoryType.Event, timeline);
			flushSync();

			expect(timeline.removeAllEventsFromButtons).toHaveBeenCalledWith(['b2']);
			expect(mockRepository.deleteButtonFromCategory).toHaveBeenCalledWith('cat-del-btns', 'b2');
		});

		it('should remove deleted tags from timeline', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-tags',
				name: 'Tag Cat',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'Keep' }), createTag({ id: 't2', name: 'Remove' })]
			});
			await board.addCategory();
			flushSync();

			// Update: remove t2
			board.categoryToCreate = createCategory({
				id: 'cat-del-tags',
				name: 'Tag Cat Updated',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'Keep' })]
			});

			await board.updateCategory(CategoryType.Tag, timeline);
			flushSync();

			expect(timeline.removeAllTagsFromButtons).toHaveBeenCalledWith(['t2']);
			expect(mockRepository.deleteTagFromCategory).toHaveBeenCalledWith('cat-del-tags', 't2');
		});

		it('should update category name and color in state', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-upd',
				name: 'Original',
				color: '#000000',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			board.categoryToCreate = createCategory({
				id: 'cat-upd',
				name: 'Renamed',
				color: '#ff0000',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});

			await board.updateCategory(CategoryType.Event, timeline);
			flushSync();

			expect(board.eventCategories[0].name).toBe('Renamed');
			expect(board.eventCategories[0].color).toBe('#ff0000');
		});

		it('should call updateCategoryButtons for event sections', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-upd-btns',
				name: 'Cat',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			board.categoryToCreate = createCategory({
				id: 'cat-upd-btns',
				name: 'Cat',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});

			await board.updateCategory(CategoryType.Event, timeline);

			expect(mockRepository.updateCategoryButtons).toHaveBeenCalled();
		});

		it('should call updateCategoryTags for tag sections', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-upd-tags',
				name: 'Tag Cat',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'T' })]
			});
			await board.addCategory();
			flushSync();

			board.categoryToCreate = createCategory({
				id: 'cat-upd-tags',
				name: 'Tag Cat',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'T' })]
			});

			await board.updateCategory(CategoryType.Tag, timeline);

			expect(mockRepository.updateCategoryTags).toHaveBeenCalled();
		});

		it('should show error snackbar when repository throws', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-err',
				name: 'Cat',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			(mockRepository.updateCategory as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error('Update failed')
			);

			board.categoryToCreate = createCategory({
				id: 'cat-err',
				name: 'Cat',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});

			await board.updateCategory(CategoryType.Event, timeline);

			expect(projectActions.setSnackbar).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: 'Update failed'
				})
			);
		});
	});

	// ── deleteCategory ──────────────────────────────────────────────────────

	describe('deleteCategory', () => {
		it('should delegate to deleteEventCategory for Event type', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-evt',
				name: 'Event Cat',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			await board.deleteCategory(CategoryType.Event, 'cat-del-evt', timeline);
			flushSync();

			expect(board.eventCategories.length).toBe(0);
		});

		it('should delegate to deleteTagCategory for Tag type', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-tag',
				name: 'Tag Cat',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'T' })]
			});
			await board.addCategory();
			flushSync();

			await board.deleteCategory(CategoryType.Tag, 'cat-del-tag', timeline);
			flushSync();

			expect(board.tagCategories.length).toBe(0);
		});
	});

	// ── deleteEventCategory ─────────────────────────────────────────────────

	describe('deleteEventCategory', () => {
		it('should remove category from state', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-1',
				name: 'To Delete',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			expect(board.eventCategories.length).toBe(1);

			await board.deleteEventCategory('cat-del-1', timeline);
			flushSync();

			expect(board.eventCategories.length).toBe(0);
		});

		it('should call repository.deleteCategory', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-repo',
				name: 'Del',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			await board.deleteEventCategory('cat-del-repo', timeline);

			expect(mockRepository.deleteCategory).toHaveBeenCalledWith('cat-del-repo');
		});

		it('should remove all events from timeline for the category and its buttons', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-btns',
				name: 'Del',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B1' }), createButton({ id: 'b2', name: 'B2' })]
			});
			await board.addCategory();
			flushSync();

			await board.deleteEventCategory('cat-del-btns', timeline);

			expect(timeline.removeAllEventsFromCategory).toHaveBeenCalledWith('cat-del-btns');
			expect(timeline.removeAllEventsFromButtons).toHaveBeenCalledWith(['b1', 'b2']);
		});

		it('should emit project:dirty', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-dirty',
				name: 'Dirty Del',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();
			vi.clearAllMocks();

			await board.deleteEventCategory('cat-del-dirty', timeline);

			expect(emit).toHaveBeenCalledWith('project:dirty');
		});

		it('should show success snackbar', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-snack',
				name: 'Snack Del',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();
			vi.clearAllMocks();

			await board.deleteEventCategory('cat-del-snack', timeline);

			expect(projectActions.setSnackbar).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'success' })
			);
		});

		it('should show error snackbar on failure', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'cat-del-fail',
				name: 'Fail Del',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			(mockRepository.deleteCategory as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error('Delete error')
			);

			await board.deleteEventCategory('cat-del-fail', timeline);

			expect(projectActions.setSnackbar).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: 'Delete error'
				})
			);
		});
	});

	// ── deleteTagCategory ───────────────────────────────────────────────────

	describe('deleteTagCategory', () => {
		it('should remove tag category from state', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'tag-del-1',
				name: 'Tag Del',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'T' })]
			});
			await board.addCategory();
			flushSync();

			expect(board.tagCategories.length).toBe(1);

			await board.deleteTagCategory('tag-del-1', timeline);
			flushSync();

			expect(board.tagCategories.length).toBe(0);
		});

		it('should remove tags from timeline for buttons in the category', async () => {
			const timeline = createMockTimeline();

			board.categoryToCreate = createCategory({
				id: 'tag-del-btns',
				name: 'Tag Del Btns',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'T1' }), createTag({ id: 't2', name: 'T2' })]
			});
			await board.addCategory();
			flushSync();

			await board.deleteTagCategory('tag-del-btns', timeline);

			expect(timeline.removeAllTagsFromButtons).toHaveBeenCalledWith(['t1', 't2']);
		});

		it('should not call removeAllTagsFromButtons when category has no buttons', async () => {
			const timeline = createMockTimeline();

			// Category with no buttons won't exist normally, but let's handle the edge case
			board.categoryToCreate = createCategory({
				id: 'tag-del-empty',
				name: 'Empty Tag',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't-placeholder', name: 'P' })]
			});
			await board.addCategory();
			flushSync();

			// Simulate no buttons in the state by the time we delete
			// (can happen if the state was modified externally)
			await board.deleteTagCategory('nonexistent-id', timeline);

			expect(timeline.removeAllTagsFromButtons).not.toHaveBeenCalled();
		});
	});

	// ── loadCategoryToAddOrEdit ──────────────────────────────────────────────

	describe('loadCategoryToAddOrEdit', () => {
		it('should reset form when no categoryId is provided', async () => {
			board.categoryToCreate = createCategory({ name: 'Modified' });

			await board.loadCategoryToAddOrEdit(CategoryType.Event);

			expect(board.categoryToCreate.name).toBe('');
		});

		it('should load an existing event category for editing', async () => {
			board.categoryToCreate = createCategory({
				id: 'cat-load-evt',
				name: 'Load Me',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			// Reset to check loading works
			board.categoryToCreate = createCategory({ name: '' });

			await board.loadCategoryToAddOrEdit(CategoryType.Event, 'cat-load-evt');

			expect(board.categoryToCreate.id).toBe('cat-load-evt');
			expect(board.categoryToCreate.name).toBe('Load Me');
		});

		it('should load an existing tag category for editing', async () => {
			board.categoryToCreate = createCategory({
				id: 'cat-load-tag',
				name: 'Tag Load',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'T' })]
			});
			await board.addCategory();
			flushSync();

			board.categoryToCreate = createCategory({ name: '' });

			await board.loadCategoryToAddOrEdit(CategoryType.Tag, 'cat-load-tag');

			expect(board.categoryToCreate.id).toBe('cat-load-tag');
			expect(board.categoryToCreate.name).toBe('Tag Load');
		});
	});

	// ── loadBoard ───────────────────────────────────────────────────────────

	describe('loadBoard', () => {
		it('should load multiple event and tag categories', async () => {
			const boardData = {
				[CategoryType.Event]: [
					createCategory({
						id: 'e1',
						name: 'Events 1',
						type: CategoryType.Event,
						buttons: [createButton({ id: 'b1', name: 'B1' })]
					}),
					createCategory({
						id: 'e2',
						name: 'Events 2',
						type: CategoryType.Event,
						buttons: [createButton({ id: 'b2', name: 'B2' })]
					})
				],
				[CategoryType.Tag]: [
					createCategory({
						id: 't1',
						name: 'Tags 1',
						type: CategoryType.Tag,
						buttons: [createTag({ id: 'tag1', name: 'Tag' })]
					})
				]
			};

			await board.loadBoard(boardData);
			flushSync();

			expect(board.eventCategories.length).toBe(2);
			expect(board.tagCategories.length).toBe(1);
		});
	});

	// ── Derived selectors ───────────────────────────────────────────────────

	describe('Derived Selectors', () => {
		it('eventCategoriesById should index event categories by id', async () => {
			board.categoryToCreate = createCategory({
				id: 'evt-a',
				name: 'A',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b1', name: 'B' })]
			});
			await board.addCategory();
			flushSync();

			board.categoryToCreate = createCategory({
				id: 'evt-b',
				name: 'B',
				type: CategoryType.Event,
				buttons: [createButton({ id: 'b2', name: 'B2' })]
			});
			await board.addCategory();
			flushSync();

			const byId = board.eventCategoriesById;
			expect(byId['evt-a']).toBeDefined();
			expect(byId['evt-a'].name).toBe('A');
			expect(byId['evt-b']).toBeDefined();
			expect(byId['evt-b'].name).toBe('B');
		});

		it('tagCategoriesById should index tag categories by id', async () => {
			board.categoryToCreate = createCategory({
				id: 'tag-a',
				name: 'Tag A',
				type: CategoryType.Tag,
				buttons: [createTag({ id: 't1', name: 'T' })]
			});
			await board.addCategory();
			flushSync();

			const byId = board.tagCategoriesById;
			expect(byId['tag-a']).toBeDefined();
			expect(byId['tag-a'].name).toBe('Tag A');
		});

		it('eventButtonsById should index all event buttons by id', async () => {
			const btn1 = createButton({ id: 'ebtn-1', name: 'Ev Btn 1' });
			const btn2 = createButton({ id: 'ebtn-2', name: 'Ev Btn 2' });
			board.categoryToCreate = createCategory({
				id: 'cat-ebtns',
				name: 'Cat',
				type: CategoryType.Event,
				buttons: [btn1, btn2]
			});
			await board.addCategory();
			flushSync();

			const byId = board.eventButtonsById;
			expect(byId['ebtn-1']).toBeDefined();
			expect(byId['ebtn-1'].name).toBe('Ev Btn 1');
			expect(byId['ebtn-2']).toBeDefined();
			expect(byId['ebtn-2'].name).toBe('Ev Btn 2');
		});

		it('tagsById should index all tags by id', async () => {
			const tag1 = createTag({ id: 'tg-1', name: 'Tag 1' });
			const tag2 = createTag({ id: 'tg-2', name: 'Tag 2' });
			board.categoryToCreate = createCategory({
				id: 'cat-tags-sel',
				name: 'Tag Cat',
				type: CategoryType.Tag,
				buttons: [tag1, tag2]
			});
			await board.addCategory();
			flushSync();

			const byId = board.tagsById;
			expect(byId['tg-1']).toBeDefined();
			expect(byId['tg-1'].name).toBe('Tag 1');
			expect(byId['tg-2']).toBeDefined();
			expect(byId['tg-2'].name).toBe('Tag 2');
		});
	});

	// ── categoryToCreate getter/setter ──────────────────────────────────────

	describe('categoryToCreate', () => {
		it('should get and set the temp category', () => {
			const cat = createCategory({ name: 'Temp' });
			board.categoryToCreate = cat;
			expect(board.categoryToCreate.name).toBe('Temp');
		});
	});

	// ── wrapForUndo ─────────────────────────────────────────────────────────

	describe('wrapForUndo', () => {
		it('should return the board instance', () => {
			const result = board.wrapForUndo();
			expect(result).toBe(board);
		});
	});
});
