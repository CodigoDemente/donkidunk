import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ExportRulesTable from '../components/ExportRulesTable.svelte';
import { CategoryType } from '../../board/types/CategoryType';
import type { Button } from '../../board/types/Button';
import type { Tag } from '../../board/types/Tag';
import type { ExportingRule } from '../types';
import type { Exporting } from '../context.svelte';

function createButton(overrides: Partial<Button> = {}): Button {
	return {
		id: 'btn-1',
		name: 'Action',
		color: '#3b82f6',
		duration: null,
		before: null,
		...overrides
	};
}

function createTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: 'tag-1',
		name: 'Important',
		color: '#ef4444',
		...overrides
	};
}

function createRule(overrides: Partial<ExportingRule> = {}): ExportingRule {
	return {
		type: CategoryType.Event,
		include: 'btn-1',
		taggedWith: [],
		temp: false,
		...overrides
	};
}

function createMockContext(rules: ExportingRule[] = []): Exporting {
	return {
		rules,
		moveRuleUp: vi.fn(),
		moveRuleDown: vi.fn(),
		deleteRule: vi.fn()
	} as unknown as Exporting;
}

function renderTable(overrides: Record<string, unknown> = {}) {
	const defaults = {
		context: createMockContext(),
		tagsList: {} as Record<string, Tag>,
		buttonsList: {} as Record<string, Button>,
		...overrides
	};
	return { result: render(ExportRulesTable, { props: defaults }), props: defaults };
}

/**
 * Each rule row has exactly 3 action buttons in order: [moveUp, moveDown, delete].
 * They're wrapped in <Tooltip> spans, so getByTitle won't work.
 */
function getActionButtons(container: HTMLElement, rowIndex: number) {
	const rows = container.querySelectorAll('tbody tr');
	const row = rows[rowIndex];
	const buttons = row.querySelectorAll('button');
	return {
		moveUp: buttons[0] as HTMLButtonElement,
		moveDown: buttons[1] as HTMLButtonElement,
		deleteBtn: buttons[2] as HTMLButtonElement
	};
}

describe('ExportRulesTable', () => {
	describe('Rendering', () => {
		it('should render empty state message when no rules', async () => {
			renderTable();
			await expect.element(page.getByText(/table is empty/)).toBeInTheDocument();
		});

		it('should render table headers', async () => {
			renderTable();
			await expect.element(page.getByText('Include')).toBeInTheDocument();
			await expect.element(page.getByText('Tagged with')).toBeInTheDocument();
			await expect.element(page.getByText('Actions')).toBeInTheDocument();
		});

		it('should render the button name for a rule', async () => {
			const btn = createButton({ id: 'btn-1', name: 'Sprint' });
			const rule = createRule({ include: 'btn-1' });
			renderTable({
				context: createMockContext([rule]),
				buttonsList: { 'btn-1': btn }
			});

			await expect.element(page.getByText('Sprint')).toBeInTheDocument();
		});

		it('should display No tags when rule has no tags', async () => {
			const btn = createButton({ id: 'btn-1', name: 'Sprint' });
			const rule = createRule({ include: 'btn-1', taggedWith: [] });
			renderTable({
				context: createMockContext([rule]),
				buttonsList: { 'btn-1': btn }
			});

			await expect.element(page.getByText('No tags')).toBeInTheDocument();
		});

		it('should display tag names when rule has tags', async () => {
			const tag = createTag({ id: 'tag-1', name: 'Urgent' });
			const rule = createRule({ include: 'btn-1', taggedWith: ['tag-1'] });
			renderTable({
				context: createMockContext([rule]),
				buttonsList: { 'btn-1': createButton() },
				tagsList: { 'tag-1': tag }
			});

			await expect.element(page.getByText('Urgent')).toBeInTheDocument();
		});

		it('should render multiple rules as table rows', async () => {
			const rules = [createRule({ include: 'btn-1' }), createRule({ include: 'btn-2' })];
			const { result } = renderTable({
				context: createMockContext(rules),
				buttonsList: {
					'btn-1': createButton({ id: 'btn-1', name: 'Sprint' }),
					'btn-2': createButton({ id: 'btn-2', name: 'Goal' })
				}
			});

			await expect.element(page.getByText('Sprint')).toBeInTheDocument();
			await expect.element(page.getByText('Goal')).toBeInTheDocument();

			const rows = result.container.querySelectorAll('tbody tr');
			expect(rows.length).toBe(2);
		});

		it('should render the info footnote', async () => {
			renderTable();
			await expect
				.element(page.getByText(/videos will be exported in the order/))
				.toBeInTheDocument();
		});
	});

	describe('Actions', () => {
		it('should call deleteRule when delete button is clicked', async () => {
			const context = createMockContext([createRule()]);
			const { result } = renderTable({
				context,
				buttonsList: { 'btn-1': createButton() }
			});

			const { deleteBtn } = getActionButtons(result.container, 0);
			deleteBtn.click();

			expect(context.deleteRule).toHaveBeenCalledWith(0);
		});

		it('should disable move up button for the first rule', async () => {
			const { result } = renderTable({
				context: createMockContext([createRule()]),
				buttonsList: { 'btn-1': createButton() }
			});

			const { moveUp } = getActionButtons(result.container, 0);
			expect(moveUp.disabled).toBe(true);
		});

		it('should disable move down button for the last rule', async () => {
			const { result } = renderTable({
				context: createMockContext([createRule()]),
				buttonsList: { 'btn-1': createButton() }
			});

			const { moveDown } = getActionButtons(result.container, 0);
			expect(moveDown.disabled).toBe(true);
		});

		it('should call moveRuleUp when move up button is clicked', async () => {
			const rules = [createRule({ include: 'btn-1' }), createRule({ include: 'btn-2' })];
			const context = createMockContext(rules);
			const { result } = renderTable({
				context,
				buttonsList: {
					'btn-1': createButton({ id: 'btn-1', name: 'Sprint' }),
					'btn-2': createButton({ id: 'btn-2', name: 'Goal' })
				}
			});

			const { moveUp } = getActionButtons(result.container, 1);
			moveUp.click();

			expect(context.moveRuleUp).toHaveBeenCalledWith(1);
		});

		it('should call moveRuleDown when move down button is clicked', async () => {
			const rules = [createRule({ include: 'btn-1' }), createRule({ include: 'btn-2' })];
			const context = createMockContext(rules);
			const { result } = renderTable({
				context,
				buttonsList: {
					'btn-1': createButton({ id: 'btn-1', name: 'Sprint' }),
					'btn-2': createButton({ id: 'btn-2', name: 'Goal' })
				}
			});

			const { moveDown } = getActionButtons(result.container, 0);
			moveDown.click();

			expect(context.moveRuleDown).toHaveBeenCalledWith(0);
		});
	});
});
