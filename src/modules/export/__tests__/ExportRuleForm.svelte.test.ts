import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ExportRuleForm from '../components/ExportRuleForm.svelte';
import { CategoryType } from '../../board/types/CategoryType';
import type { Button } from '../../board/types/Button';
import type { Tag } from '../../board/types/Tag';
import type { ExportingRule } from '../types';

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

function createNewRule(): ExportingRule {
	return {
		type: CategoryType.Event,
		include: '',
		taggedWith: [],
		temp: true
	};
}

function renderForm(overrides: Record<string, unknown> = {}) {
	const defaults = {
		addRule: vi.fn(),
		newRule: createNewRule(),
		eventButtons: [] as Button[],
		tagsForSelectedButton: [] as Tag[],
		...overrides
	};
	return { result: render(ExportRuleForm, { props: defaults }), props: defaults };
}

describe('ExportRuleForm', () => {
	describe('Rendering', () => {
		it('should render the event selection label', async () => {
			renderForm();
			await expect.element(page.getByText('Select the event')).toBeInTheDocument();
		});

		it('should render the tags selection label', async () => {
			renderForm();
			await expect.element(page.getByText('Select the related tags')).toBeInTheDocument();
		});

		it('should render the add rule button', async () => {
			renderForm();
			await expect.element(page.getByText('Add this rule')).toBeInTheDocument();
		});

		it('should render event buttons as radio options', async () => {
			const buttons = [
				createButton({ id: 'btn-1', name: 'Sprint' }),
				createButton({ id: 'btn-2', name: 'Goal' })
			];
			renderForm({ eventButtons: buttons });

			await expect.element(page.getByText('Sprint')).toBeInTheDocument();
			await expect.element(page.getByText('Goal')).toBeInTheDocument();
		});

		it('should render no event radio buttons when eventButtons is empty', async () => {
			const { result } = renderForm({ eventButtons: [] });
			const radios = result.container.querySelectorAll('input[type="radio"][name="event-radio"]');
			expect(radios.length).toBe(0);
		});

		it('should render radio inputs for each event button', async () => {
			const buttons = [
				createButton({ id: 'btn-1', name: 'Sprint' }),
				createButton({ id: 'btn-2', name: 'Goal' }),
				createButton({ id: 'btn-3', name: 'Foul' })
			];
			const { result } = renderForm({ eventButtons: buttons });
			const radios = result.container.querySelectorAll('input[type="radio"][name="event-radio"]');
			expect(radios.length).toBe(3);
		});
	});

	describe('Interaction', () => {
		it('should call addRule when the add button is clicked', async () => {
			const addRule = vi.fn();
			renderForm({ addRule });

			const btn = page.getByText('Add this rule');
			await btn.click();

			expect(addRule).toHaveBeenCalledOnce();
		});

		it('should check the radio for the matching button when newRule.include is set', async () => {
			const newRule = createNewRule();
			newRule.include = 'btn-1';
			const buttons = [
				createButton({ id: 'btn-1', name: 'Sprint' }),
				createButton({ id: 'btn-2', name: 'Goal' })
			];
			const { result } = renderForm({ eventButtons: buttons, newRule });

			const radios = result.container.querySelectorAll(
				'input[type="radio"][name="event-radio"]'
			) as NodeListOf<HTMLInputElement>;
			const sprintRadio = Array.from(radios).find((r) => r.value === 'btn-1');
			expect(sprintRadio?.checked).toBe(true);
		});

		it('should highlight the selected event button with border-primary', async () => {
			const newRule = createNewRule();
			newRule.include = 'btn-1';

			const buttons = [createButton({ id: 'btn-1', name: 'Sprint' })];
			const { result } = renderForm({ eventButtons: buttons, newRule });

			const selectedLabel = result.container.querySelector('.border-primary');
			expect(selectedLabel).not.toBeNull();
		});

		it('should update newRule.include when clicking a radio button', async () => {
			const newRule = createNewRule();
			const buttons = [createButton({ id: 'btn-1', name: 'Sprint' })];
			const { result } = renderForm({ eventButtons: buttons, newRule });

			const radio = result.container.querySelector(
				'input[type="radio"][value="btn-1"]'
			) as HTMLInputElement;
			radio.click();

			expect(newRule.include).toBe('btn-1');
		});

		it('should clear taggedWith when switching to a different button', async () => {
			const newRule = createNewRule();
			newRule.include = 'btn-1';
			newRule.taggedWith = ['tag-1', 'tag-2'];

			const buttons = [
				createButton({ id: 'btn-1', name: 'Sprint' }),
				createButton({ id: 'btn-2', name: 'Goal' })
			];
			const { result } = renderForm({ eventButtons: buttons, newRule });

			const radio = result.container.querySelector(
				'input[type="radio"][value="btn-2"]'
			) as HTMLInputElement;
			radio.click();

			expect(newRule.include).toBe('btn-2');
			expect(newRule.taggedWith).toEqual([]);
		});
	});
});
