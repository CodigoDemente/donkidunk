import { describe, test, expect } from 'vitest';
import { categoryValidationSchema, buttonValidationSchema } from '../validationSchema';
import type { Category } from '../types/Category';
import { CategoryType } from '../types/CategoryType';
import type { Button } from '../types/Button';
import type { Tag } from '../types/Tag';

// ─── Helpers ────────────────────────────────────────────────────────────────

function createCategory(overrides: Partial<Category> = {}): Category {
	return {
		id: 'cat-1',
		name: 'Test Category',
		type: CategoryType.Event,
		color: '#000000',
		position: { x: 0, y: 0 },
		buttons: [{ id: 'btn-1', name: 'Button 1', color: '#ff0000', duration: null, before: null }],
		...overrides
	};
}

function createButton(overrides: Partial<Button> = {}): Button {
	return {
		id: 'btn-1',
		name: 'Test Button',
		color: '#ff0000',
		duration: null,
		before: null,
		...overrides
	};
}

function createTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: 'tag-1',
		name: 'Test Tag',
		color: '#00ff00',
		...overrides
	};
}

// ─── categoryValidationSchema ───────────────────────────────────────────────

describe('categoryValidationSchema', () => {
	const [nameRule, buttonsRule] = categoryValidationSchema;

	describe('name validation', () => {
		test('should fail when category name is empty', () => {
			const category = createCategory({ name: '' });
			expect(nameRule.validate(category)).toBe(true);
		});

		test('should fail when category name is only whitespace', () => {
			const category = createCategory({ name: '   ' });
			expect(nameRule.validate(category)).toBe(true);
		});

		test('should pass when category name is not empty', () => {
			const category = createCategory({ name: 'Valid Name' });
			expect(nameRule.validate(category)).toBe(false);
		});

		test('should pass when category name has leading/trailing spaces but content', () => {
			const category = createCategory({ name: '  Valid  ' });
			expect(nameRule.validate(category)).toBe(false);
		});

		test('should have the correct error message', () => {
			expect(nameRule.message).toBe('Cannot be empty');
		});
	});

	describe('buttons validation', () => {
		test('should fail when category has no buttons', () => {
			const category = createCategory({ buttons: [] });
			expect(buttonsRule.validate(category)).toBe(true);
		});

		test('should pass when category has at least one button', () => {
			const category = createCategory();
			expect(buttonsRule.validate(category)).toBe(false);
		});

		test('should pass when category has multiple buttons', () => {
			const category = createCategory({
				buttons: [createButton({ id: 'b1', name: 'A' }), createButton({ id: 'b2', name: 'B' })]
			});
			expect(buttonsRule.validate(category)).toBe(false);
		});

		test('should have the correct error message', () => {
			expect(buttonsRule.message).toBe('Category must have at least one button');
		});
	});
});

// ─── buttonValidationSchema ─────────────────────────────────────────────────

describe('buttonValidationSchema', () => {
	const [nameRule, uniquenessRule] = buttonValidationSchema;

	describe('name validation', () => {
		test('should fail when button name is empty', () => {
			const button = createButton({ name: '' });
			expect(nameRule.validate(button, 0, [button])).toBe(true);
		});

		test('should fail when button name is only whitespace', () => {
			const button = createButton({ name: '   ' });
			expect(nameRule.validate(button, 0, [button])).toBe(true);
		});

		test('should pass when button name has content', () => {
			const button = createButton({ name: 'Valid' });
			expect(nameRule.validate(button, 0, [button])).toBe(false);
		});

		test('should work with Tag type as well', () => {
			const tag = createTag({ name: '' });
			expect(nameRule.validate(tag, 0, [tag])).toBe(true);

			const validTag = createTag({ name: 'Valid Tag' });
			expect(nameRule.validate(validTag, 0, [validTag])).toBe(false);
		});

		test('should have the correct error message', () => {
			expect(nameRule.message).toBe('Cannot be empty');
		});
	});

	describe('uniqueness validation', () => {
		test('should fail when two buttons have the same name', () => {
			const buttons: Button[] = [
				createButton({ id: 'b1', name: 'Duplicate' }),
				createButton({ id: 'b2', name: 'Duplicate' })
			];
			// Check the second button (idx=1) against the list
			expect(uniquenessRule.validate(buttons[1], 1, buttons)).toBeTruthy();
		});

		test('should fail when names match case-insensitively', () => {
			const buttons: Button[] = [
				createButton({ id: 'b1', name: 'hello' }),
				createButton({ id: 'b2', name: 'HELLO' })
			];
			expect(uniquenessRule.validate(buttons[1], 1, buttons)).toBeTruthy();
		});

		test('should fail when names match after trimming', () => {
			const buttons: Button[] = [
				createButton({ id: 'b1', name: 'test' }),
				createButton({ id: 'b2', name: '  test  ' })
			];
			expect(uniquenessRule.validate(buttons[1], 1, buttons)).toBeTruthy();
		});

		test('should pass when all button names are unique', () => {
			const buttons: Button[] = [
				createButton({ id: 'b1', name: 'Alpha' }),
				createButton({ id: 'b2', name: 'Beta' }),
				createButton({ id: 'b3', name: 'Gamma' })
			];
			expect(uniquenessRule.validate(buttons[0], 0, buttons)).toBeFalsy();
			expect(uniquenessRule.validate(buttons[1], 1, buttons)).toBeFalsy();
			expect(uniquenessRule.validate(buttons[2], 2, buttons)).toBeFalsy();
		});

		test('should not compare a button with itself', () => {
			const buttons: Button[] = [createButton({ id: 'b1', name: 'Solo' })];
			expect(uniquenessRule.validate(buttons[0], 0, buttons)).toBeFalsy();
		});

		test('should work with tags', () => {
			const tags: Tag[] = [
				createTag({ id: 't1', name: 'Important' }),
				createTag({ id: 't2', name: 'important' })
			];
			expect(uniquenessRule.validate(tags[1], 1, tags)).toBeTruthy();
		});

		test('should detect duplicates among multiple items', () => {
			const buttons: Button[] = [
				createButton({ id: 'b1', name: 'Unique1' }),
				createButton({ id: 'b2', name: 'Unique2' }),
				createButton({ id: 'b3', name: 'Unique1' }) // Duplicate of first
			];
			expect(uniquenessRule.validate(buttons[0], 0, buttons)).toBeTruthy();
			expect(uniquenessRule.validate(buttons[1], 1, buttons)).toBeFalsy();
			expect(uniquenessRule.validate(buttons[2], 2, buttons)).toBeTruthy();
		});

		test('should have the correct error message', () => {
			expect(uniquenessRule.message).toBe('Names must be unique');
		});
	});
});
