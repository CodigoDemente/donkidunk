/**
 * Keyboard Handlers
 * Handlers for keyboard interactions
 */

/**
 * Check if a keyboard event should be ignored (e.g., when typing in inputs)
 */
export function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
	const target = event.target;
	return (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		(target instanceof HTMLElement && target.isContentEditable)
	);
}

/**
 * Check if key is a delete key (Delete or Backspace)
 */
export function isDeleteKey(key: string): boolean {
	return key === 'Delete' || key === 'Backspace';
}
