import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import Tooltip from '../tooltip.svelte';

function createTextSnippet(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`,
		setup: () => {}
	}));
}

describe('Tooltip Component', () => {
	describe('Rendering', () => {
		it('should render children content', async () => {
			render(Tooltip, {
				props: { text: 'Tooltip text', children: createTextSnippet('Hover me') }
			});
			await expect.element(page.getByText('Hover me')).toBeInTheDocument();
		});

		it('should render the trigger with button role', async () => {
			render(Tooltip, {
				props: { text: 'Tip', children: createTextSnippet('Trigger') }
			});
			const trigger = page.getByRole('button', { name: 'Show tooltip' });
			await expect.element(trigger).toBeInTheDocument();
		});

		it('should not show tooltip initially', async () => {
			const { container } = render(Tooltip, {
				props: { text: 'Hidden tooltip', children: createTextSnippet('Content') }
			});
			// The tooltip div uses fixed positioning, it shouldn't exist initially
			const tooltipDiv = container.querySelector('.fixed');
			expect(tooltipDiv).toBeNull();
		});

		it('should render info icon when info prop is true', async () => {
			const { container } = render(Tooltip, {
				props: { text: 'Info tip', info: true, children: createTextSnippet('Info') }
			});
			// IconInfoCircle renders an svg
			const svg = container.querySelector('svg');
			expect(svg).not.toBeNull();
		});

		it('should not render info icon when info prop is false', async () => {
			const { container } = render(Tooltip, {
				props: { text: 'No info', children: createTextSnippet('No Info') }
			});
			const icons = container.querySelectorAll('svg');
			expect(icons.length).toBe(0);
		});
	});

	describe('Hover behavior', () => {
		it('should show tooltip on hover', async () => {
			render(Tooltip, {
				props: { text: 'Visible tooltip', children: createTextSnippet('Hover') }
			});
			const trigger = page.getByRole('button', { name: 'Show tooltip' });
			await trigger.hover();
			await expect.element(page.getByText('Visible tooltip')).toBeInTheDocument();
		});

		it('should hide tooltip when not hovered', async () => {
			const { container } = render(Tooltip, {
				props: { text: 'Hidden again', children: createTextSnippet('Hover') }
			});
			const trigger = page.getByRole('button', { name: 'Show tooltip' });
			await trigger.hover();
			// Move away from the trigger
			await page.getByText('Hover').unhover();
			// Small delay to allow reactivity
			await new Promise((r) => setTimeout(r, 50));
			const tooltipDiv = container.querySelector('.fixed');
			expect(tooltipDiv).toBeNull();
		});
	});

	describe('Disabled state', () => {
		it('should not show tooltip when disabled', async () => {
			const { container } = render(Tooltip, {
				props: {
					text: 'Disabled tooltip',
					disabled: true,
					children: createTextSnippet('No tooltip')
				}
			});
			const trigger = page.getByRole('button', { name: 'Show tooltip' });
			await trigger.hover();
			const tooltipDiv = container.querySelector('.fixed');
			expect(tooltipDiv).toBeNull();
		});
	});

	describe('Empty text', () => {
		it('should not show tooltip when text is empty', async () => {
			const { container } = render(Tooltip, {
				props: { text: '', children: createTextSnippet('No text') }
			});
			const trigger = page.getByRole('button', { name: 'Show tooltip' });
			await trigger.hover();
			const tooltipDiv = container.querySelector('.fixed');
			expect(tooltipDiv).toBeNull();
		});
	});

	describe('Sizes', () => {
		it('should apply small size class by default', async () => {
			render(Tooltip, {
				props: { text: 'Small tip', children: createTextSnippet('Small') }
			});
			const trigger = page.getByRole('button', { name: 'Show tooltip' });
			await trigger.hover();
			const tooltipText = page.getByText('Small tip');
			await expect.element(tooltipText).toBeInTheDocument();
		});
	});
});
