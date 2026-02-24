import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Modal from '../modal.svelte';
import MockContent from './MockContent.svelte';
import type { ProjectData } from '../../../persistence/stores/project/types/Project';

function createModalStore(overrides: Partial<ProjectData['modal']> = {}): ProjectData['modal'] {
	return {
		content: MockContent,
		title: 'Test Modal',
		show: false,
		dismissible: true,
		size: 'medium',
		onCancel: vi.fn(),
		onSubmit: vi.fn(),
		onSubmitText: 'Submit',
		...overrides
	};
}

describe('Modal Component', () => {
	describe('Visibility', () => {
		it('should not render when show is false', async () => {
			const store = createModalStore({ show: false });
			const { container } = render(Modal, { props: { modalStore: store } });
			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog).toBeNull();
		});

		it('should render when show is true', async () => {
			const store = createModalStore({ show: true });
			render(Modal, { props: { modalStore: store } });
			const dialog = page.getByRole('dialog');
			await expect.element(dialog).toBeInTheDocument();
		});
	});

	describe('Content', () => {
		it('should display the title', async () => {
			const store = createModalStore({ show: true, title: 'My Title' });
			render(Modal, { props: { modalStore: store } });
			await expect.element(page.getByText('My Title')).toBeInTheDocument();
		});

		it('should render the content component', async () => {
			const store = createModalStore({ show: true });
			render(Modal, { props: { modalStore: store } });
			await expect.element(page.getByText('Mock modal content')).toBeInTheDocument();
		});

		it('should display custom submit text', async () => {
			const store = createModalStore({ show: true, onSubmitText: 'Confirm' });
			render(Modal, { props: { modalStore: store } });
			await expect.element(page.getByText('Confirm')).toBeInTheDocument();
		});

		it('should display default submit text when not specified', async () => {
			const store = createModalStore({ show: true, onSubmitText: undefined });
			render(Modal, { props: { modalStore: store } });
			await expect.element(page.getByText('Submit')).toBeInTheDocument();
		});
	});

	describe('Dismissible modal', () => {
		it('should show close button when dismissible', async () => {
			const store = createModalStore({ show: true, dismissible: true });
			render(Modal, { props: { modalStore: store } });
			const closeBtn = page.getByRole('button', { name: 'Close' });
			await expect.element(closeBtn).toBeInTheDocument();
		});

		it('should show Cancel and Submit buttons when dismissible', async () => {
			const store = createModalStore({ show: true, dismissible: true });
			render(Modal, { props: { modalStore: store } });
			await expect.element(page.getByText('Cancel')).toBeInTheDocument();
			await expect.element(page.getByText('Submit')).toBeInTheDocument();
		});

		it('should not show close button when not dismissible', async () => {
			const store = createModalStore({ show: true, dismissible: false });
			const { container } = render(Modal, { props: { modalStore: store } });
			const closeBtn = container.querySelector('[aria-label="Close"]');
			expect(closeBtn).toBeNull();
		});

		it('should not show footer buttons when not dismissible', async () => {
			const store = createModalStore({ show: true, dismissible: false });
			const { container } = render(Modal, { props: { modalStore: store } });
			// No Cancel/Submit buttons in footer
			const footerButtons = container.querySelectorAll('.shrink-0.justify-end button');
			expect(footerButtons.length).toBe(0);
		});
	});

	describe('Interaction', () => {
		it('should call onSubmit when clicking submit button', async () => {
			const onSubmit = vi.fn();
			const store = createModalStore({ show: true, onSubmit });
			render(Modal, { props: { modalStore: store } });
			const submitBtn = page.getByText('Submit');
			await submitBtn.click();
			expect(onSubmit).toHaveBeenCalledOnce();
		});

		it('should call onCancel when clicking cancel button', async () => {
			const onCancel = vi.fn();
			const store = createModalStore({ show: true, onCancel });
			render(Modal, { props: { modalStore: store } });
			const cancelBtn = page.getByText('Cancel');
			await cancelBtn.click();
			expect(onCancel).toHaveBeenCalledOnce();
		});

		it('should call onCancel when clicking close button', async () => {
			const onCancel = vi.fn();
			const store = createModalStore({ show: true, onCancel });
			render(Modal, { props: { modalStore: store } });
			const closeBtn = page.getByRole('button', { name: 'Close' });
			await closeBtn.click();
			expect(onCancel).toHaveBeenCalledOnce();
		});
	});

	describe('Sizes', () => {
		it('should apply medium size class', async () => {
			const store = createModalStore({ show: true, size: 'medium' });
			const { container } = render(Modal, { props: { modalStore: store } });
			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog?.classList.contains('max-w-xl')).toBe(true);
		});

		it('should apply small size class', async () => {
			const store = createModalStore({ show: true, size: 'small' });
			const { container } = render(Modal, { props: { modalStore: store } });
			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog?.classList.contains('max-w-md')).toBe(true);
		});

		it('should apply large size class', async () => {
			const store = createModalStore({ show: true, size: 'large' });
			const { container } = render(Modal, { props: { modalStore: store } });
			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog?.classList.contains('max-w-3xl')).toBe(true);
		});

		it('should apply extralarge size class', async () => {
			const store = createModalStore({ show: true, size: 'extralarge' });
			const { container } = render(Modal, { props: { modalStore: store } });
			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog?.classList.contains('max-w-4xl')).toBe(true);
		});
	});

	describe('Accessibility', () => {
		it('should have aria-modal attribute', async () => {
			const store = createModalStore({ show: true });
			render(Modal, { props: { modalStore: store } });
			const dialog = page.getByRole('dialog');
			await expect.element(dialog).toHaveAttribute('aria-modal', 'true');
		});

		it('should have dialog role', async () => {
			const store = createModalStore({ show: true });
			render(Modal, { props: { modalStore: store } });
			const dialog = page.getByRole('dialog');
			await expect.element(dialog).toBeInTheDocument();
		});

		it('should be focusable (tabindex 0)', async () => {
			const store = createModalStore({ show: true });
			render(Modal, { props: { modalStore: store } });
			const dialog = page.getByRole('dialog');
			await expect.element(dialog).toHaveAttribute('tabindex', '0');
		});
	});
});
