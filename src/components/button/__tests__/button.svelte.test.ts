import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import Button from '../button.svelte';

function createTextSnippet(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`,
		setup: () => {}
	}));
}

describe('Button Component', () => {
	describe('Rendering', () => {
		it('should render the button with children content', async () => {
			render(Button, { props: { children: createTextSnippet('Click me') } });
			await expect.element(page.getByText('Click me')).toBeInTheDocument();
		});

		it('should render as a button element', async () => {
			render(Button, { props: { children: createTextSnippet('Btn') } });
			const btn = page.getByRole('button');
			await expect.element(btn).toBeInTheDocument();
		});
	});

	describe('Variants', () => {
		it('should apply primary background class', async () => {
			render(Button, { props: { children: createTextSnippet('Primary'), primary: true } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('bg-primary');
		});

		it('should apply tertiary background class', async () => {
			render(Button, { props: { children: createTextSnippet('Tertiary'), tertiary: true } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('bg-tertiary');
		});

		it('should apply secondary background class by default', async () => {
			render(Button, { props: { children: createTextSnippet('Default') } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('bg-secondary');
		});

		it('should apply white text color for primary variant', async () => {
			render(Button, { props: { children: createTextSnippet('Primary'), primary: true } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('text-supportWhite');
		});

		it('should apply white text color for tertiary variant', async () => {
			render(Button, { props: { children: createTextSnippet('Tertiary'), tertiary: true } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('text-supportWhite');
		});

		it('should apply black text color for default variant', async () => {
			render(Button, { props: { children: createTextSnippet('Default') } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('text-supportBlack');
		});
	});

	describe('Sizes', () => {
		it('should apply medium width by default', async () => {
			render(Button, { props: { children: createTextSnippet('Medium') } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('w-32');
		});

		it('should apply mini width', async () => {
			render(Button, { props: { children: createTextSnippet('Mini'), size: 'mini' } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('w-6');
		});

		it('should apply small width', async () => {
			render(Button, { props: { children: createTextSnippet('Small'), size: 'small' } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('w-18');
		});

		it('should apply large width', async () => {
			render(Button, { props: { children: createTextSnippet('Large'), size: 'large' } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('w-40');
		});

		it('should apply extralarge width', async () => {
			render(Button, {
				props: { children: createTextSnippet('ExtraLarge'), size: 'extralarge' }
			});
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('w-48');
		});

		it('should apply fluid width', async () => {
			render(Button, { props: { children: createTextSnippet('Fluid'), size: 'fluid' } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('w-full');
		});
	});

	describe('Interaction', () => {
		it('should call onClick when clicked', async () => {
			const onClick = vi.fn();
			render(Button, { props: { children: createTextSnippet('Click'), onClick } });
			const btn = page.getByRole('button');
			await btn.click();
			expect(onClick).toHaveBeenCalledOnce();
		});

		it('should not trigger action when disabled', async () => {
			render(Button, {
				props: { children: createTextSnippet('Disabled'), disabled: true }
			});
			const btn = page.getByRole('button');
			await expect.element(btn).toBeDisabled();
		});
	});

	describe('Disabled state', () => {
		it('should have disabled attribute', async () => {
			render(Button, { props: { children: createTextSnippet('Disabled'), disabled: true } });
			const btn = page.getByRole('button');
			await expect.element(btn).toBeDisabled();
		});

		it('should apply disabled styling (cursor-not-allowed and opacity)', async () => {
			render(Button, { props: { children: createTextSnippet('Disabled'), disabled: true } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('cursor-not-allowed');
			await expect.element(btn).toHaveClass('opacity-70');
		});

		it('should have hover:cursor-pointer when enabled', async () => {
			render(Button, { props: { children: createTextSnippet('Enabled') } });
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('hover:cursor-pointer');
		});
	});

	describe('Custom styling', () => {
		it('should apply custom class', async () => {
			render(Button, {
				props: { children: createTextSnippet('Custom'), customClass: 'my-special-btn' }
			});
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveClass('my-special-btn');
		});

		it('should apply inline style', async () => {
			render(Button, {
				props: { children: createTextSnippet('Styled'), style: 'margin-top: 10px;' }
			});
			const btn = page.getByRole('button');
			await expect.element(btn).toHaveAttribute('style', 'margin-top: 10px;');
		});
	});
});
