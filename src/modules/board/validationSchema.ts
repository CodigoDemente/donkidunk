import type { Category } from './types/Category';
import type { Tag } from './types/Tag';
import type { Button } from './types/Button';

export const tagValidationSchema = [
	{
		validate: (tag: Tag) => tag.name.trim() === '',
		message: 'Tag name cannot be empty'
	},
	{
		validate: (tag: Tag, idx: number, tags: Tag[]) => {
			const name = tag.name.trim().toLowerCase();
			return (
				name && tags.filter((t, i) => t.name.trim().toLowerCase() === name && i !== idx).length > 0
			);
		},
		message: 'Tag names must be unique'
	}
];

export const categoryValidationSchema = [
	{
		validate: (category: Category) => category.name.trim() === '',
		message: 'Category name cannot be empty'
	},
	{
		validate: (category: Category) => category.buttons.length === 0,
		message: 'Category must have at least one button'
	}
];

export const buttonValidationSchema = [
	{
		validate: (button: Button) => button.name.trim() === '',
		message: 'Button name cannot be empty'
	}
];
