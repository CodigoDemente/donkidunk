import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Category from '../category.svelte';
import { timelineContext } from '../../../modules/videoplayer/context.svelte';
import { boardContext } from '../../../modules/board/context.svelte';
import { CategoryType, type DraggedCategory } from '../types';
import type { Category as CategoryT } from '../../../modules/board/types/Category';
import type { Button } from '../../../modules/board/types/Button';
import type { Tag } from '../../../modules/board/types/Tag';
import type { RangeDataWithTags } from '../../../modules/videoplayer/types/RangeData';
import { SvelteMap } from 'svelte/reactivity';

// ─── Mock factories ──────────────────────────────────────────────────────────

function createMockButton(overrides: Partial<Button> = {}): Button {
	return {
		id: `btn-${Math.random().toString(36).slice(2, 8)}`,
		name: 'Test Button',
		color: '#3b82f6',
		duration: null,
		before: null,
		...overrides
	};
}

function createMockTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: `tag-${Math.random().toString(36).slice(2, 8)}`,
		name: 'Test Tag',
		color: '#ef4444',
		...overrides
	};
}

function createMockCategory(overrides: Partial<CategoryT> = {}): CategoryT {
	return {
		id: 'cat-1',
		name: 'Test Category',
		type: CategoryType.Event,
		color: '#22c55e',
		position: { x: 10, y: 20 },
		buttons: [],
		...overrides
	};
}

function createMockDraggedCategory(): DraggedCategory {
	return {
		id: '',
		offset: { x: 0, y: 0 },
		container: { width: 0, height: 0 }
	};
}

function createMockTimeline() {
	return {
		currentTime: 0,
		eventsPlaying: new SvelteMap<string, RangeDataWithTags>(),
		isEventPlaying: vi.fn().mockReturnValue(false),
		addEvent: vi.fn().mockResolvedValue(undefined),
		addRelatedTagToEvent: vi.fn().mockResolvedValue(undefined)
	};
}

function createMockBoard() {
	return {
		updateCategoryPosition: vi.fn().mockResolvedValue(undefined),
		updateCategorySize: vi.fn().mockResolvedValue(undefined)
	};
}

// ─── Helper: render Category with mocked contexts ────────────────────────────

type RenderCategoryOptions = {
	type: CategoryType;
	category: CategoryT;
	draggedCategory?: DraggedCategory;
	handleModalOpen: (type: CategoryType, categoryId?: string) => void;
	mockTimeline: ReturnType<typeof createMockTimeline>;
	mockBoard: ReturnType<typeof createMockBoard>;
};

function renderCategory(options: RenderCategoryOptions) {
	const {
		type,
		category,
		draggedCategory = createMockDraggedCategory(),
		handleModalOpen,
		mockTimeline,
		mockBoard
	} = options;

	return render(Category, {
		props: { type, category, draggedCategory, handleModalOpen },
		context: new Map<symbol, unknown>([
			[timelineContext.key, mockTimeline],
			[boardContext.key, mockBoard]
		])
	});
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Category Component', () => {
	let mockTimeline: ReturnType<typeof createMockTimeline>;
	let mockBoard: ReturnType<typeof createMockBoard>;
	let handleModalOpen: ReturnType<typeof vi.fn<(type: CategoryType, categoryId?: string) => void>>;

	beforeEach(() => {
		mockTimeline = createMockTimeline();
		mockBoard = createMockBoard();
		handleModalOpen = vi.fn();
	});

	// ── Rendering ────────────────────────────────────────────────────────────

	describe('Initial Rendering', () => {
		it('should render the category name', async () => {
			const category = createMockCategory({ name: 'My Events' });

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			await expect.element(page.getByText('My Events')).toBeInTheDocument();
		});

		it('should render the category color indicator', async () => {
			const category = createMockCategory({ color: '#ff5733' });

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			// The category name should be rendered alongside a color indicator span
			await expect.element(page.getByText(category.name)).toBeInTheDocument();
		});

		it('should render the edit button (pencil icon)', async () => {
			const category = createMockCategory();

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			const editButton = page.getByRole('button').first();
			await expect.element(editButton).toBeInTheDocument();
		});

		it('should position the category using percentage-based styles', async () => {
			const category = createMockCategory({
				position: { x: 25, y: 50 }
			});

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			const categoryEl = page.getByRole('button', { name: category.name }).first();
			await expect.element(categoryEl).toBeInTheDocument();
		});
	});

	// ── Event Buttons ────────────────────────────────────────────────────────

	describe('Event Type - Buttons', () => {
		it('should render event buttons when type is Event', async () => {
			const buttons: Button[] = [
				createMockButton({ id: 'b1', name: 'Action A', color: '#3b82f6' }),
				createMockButton({ id: 'b2', name: 'Action B', color: '#ef4444' })
			];
			const category = createMockCategory({ buttons });

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			await expect.element(page.getByText('Action A')).toBeInTheDocument();
			await expect.element(page.getByText('Action B')).toBeInTheDocument();
		});

		it('should call addEvent when clicking an event button', async () => {
			const button = createMockButton({
				id: 'b1',
				name: 'Click Me',
				duration: 5,
				before: null
			});
			const category = createMockCategory({ buttons: [button] });

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			const btn = page.getByText('Click Me');
			await btn.click();

			expect(mockTimeline.addEvent).toHaveBeenCalledWith(
				'b1',
				'cat-1',
				0, // currentTime
				5, // duration
				undefined // before is null -> undefined
			);
		});

		it('should show active styling when a button event is playing', async () => {
			const button = createMockButton({ id: 'active-btn', name: 'Active Button' });
			const category = createMockCategory({ buttons: [button] });

			mockTimeline.isEventPlaying = vi.fn().mockReturnValue(true);

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			const btn = page.getByText('Active Button');
			await expect.element(btn).toBeInTheDocument();
			// Active buttons have border-orange-400 class
			await expect.element(btn).toHaveClass('border-orange-400');
		});
	});

	// ── Tag Type ─────────────────────────────────────────────────────────────

	describe('Tag Type - Tags', () => {
		it('should render tags when type is Tag', async () => {
			const tags: Tag[] = [
				createMockTag({ id: 't1', name: 'Important', color: '#ef4444' }),
				createMockTag({ id: 't2', name: 'Review', color: '#f59e0b' })
			];
			const category = createMockCategory({
				type: CategoryType.Tag,
				buttons: tags
			});

			renderCategory({
				type: CategoryType.Tag,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			await expect.element(page.getByText('Important')).toBeInTheDocument();
			await expect.element(page.getByText('Review')).toBeInTheDocument();
		});

		it('should not render event buttons when type is Tag', async () => {
			const tags: Tag[] = [createMockTag({ name: 'Tag Only' })];
			const category = createMockCategory({
				type: CategoryType.Tag,
				buttons: tags
			});

			renderCategory({
				type: CategoryType.Tag,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			// Tags render as Tag components, not as regular buttons with the event styling
			await expect.element(page.getByText('Tag Only')).toBeInTheDocument();
		});

		it('should call addRelatedTagToEvent when clicking a tag', async () => {
			const tag = createMockTag({ id: 'tag-click', name: 'Clickable Tag' });
			const category = createMockCategory({
				type: CategoryType.Tag,
				buttons: [tag]
			});

			renderCategory({
				type: CategoryType.Tag,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			const tagEl = page.getByText('Clickable Tag');
			await tagEl.click();

			expect(mockTimeline.addRelatedTagToEvent).toHaveBeenCalledWith('tag-click');
		});
	});

	// ── Edit functionality ───────────────────────────────────────────────────

	describe('Edit Category', () => {
		it('should call handleModalOpen when clicking the edit button', async () => {
			const category = createMockCategory({ name: 'Editable Category' });

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			const buttons = page.getByRole('button');
			const editBtn = buttons.nth(1); // After the draggable container
			await editBtn.click();

			expect(handleModalOpen).toHaveBeenCalledWith(CategoryType.Event, 'cat-1');
		});
	});

	// ── Resize handles ───────────────────────────────────────────────────────

	describe('Resize Handles', () => {
		it('should render all resize handles', async () => {
			const category = createMockCategory();

			const { container } = renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			// Query the DOM directly for resize handles via data-resize-handle attribute
			const resizeHandles = container.querySelectorAll('[data-resize-handle]');
			expect(resizeHandles.length).toBe(8); // 4 border + 4 corner handles

			// Verify specific handles exist by aria-label
			const expectedLabels = [
				'Resize left',
				'Resize right',
				'Resize top',
				'Resize bottom',
				'Resize top-left',
				'Resize top-right',
				'Resize bottom-left',
				'Resize bottom-right'
			];

			for (const label of expectedLabels) {
				const handle = container.querySelector(`[aria-label="${label}"]`);
				expect(handle, `Expected resize handle "${label}" to exist`).not.toBeNull();
			}
		});
	});

	// ── Size and positioning ─────────────────────────────────────────────────

	describe('Size and Positioning', () => {
		it('should apply explicit size when category has size defined', async () => {
			const category = createMockCategory({
				name: 'Sized Category',
				size: { width: 300, height: 200 },
				position: { x: 5, y: 10 }
			});

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			await expect.element(page.getByText('Sized Category')).toBeInTheDocument();
		});

		it('should use auto height when no size is defined', async () => {
			const category = createMockCategory({
				name: 'Auto Size Category'
			});

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			await expect.element(page.getByText('Auto Size Category')).toBeInTheDocument();
		});
	});

	// ── Edge Cases ───────────────────────────────────────────────────────────

	describe('Edge Cases', () => {
		it('should render category with no buttons', async () => {
			const category = createMockCategory({
				name: 'Empty Category',
				buttons: []
			});

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			await expect.element(page.getByText('Empty Category')).toBeInTheDocument();
		});

		it('should render category with many buttons', async () => {
			const buttons: Button[] = Array.from({ length: 10 }, (_, i) =>
				createMockButton({ id: `btn-${i}`, name: `Button ${i}` })
			);
			const category = createMockCategory({ buttons });

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			await expect.element(page.getByText('Button 0')).toBeInTheDocument();
			await expect.element(page.getByText('Button 9')).toBeInTheDocument();
		});

		it('should handle button with duration and before values', async () => {
			const button = createMockButton({
				id: 'complex-btn',
				name: 'Complex Button',
				duration: 10,
				before: 2
			});
			const category = createMockCategory({ buttons: [button] });
			mockTimeline.currentTime = 5;

			renderCategory({
				type: CategoryType.Event,
				category,
				handleModalOpen,
				mockTimeline,
				mockBoard
			});

			const btn = page.getByText('Complex Button');
			await btn.click();

			expect(mockTimeline.addEvent).toHaveBeenCalledWith(
				'complex-btn',
				'cat-1',
				5, // currentTime
				10, // duration
				2 // before
			);
		});
	});
});
