import type { Category } from './types/Category';
import type { Tag } from './types/Tag';
import type { Button } from './types/Button';

export const categoryValidationSchema = [
	{
		validate: (category: Category) => category.name.trim() === '',
		message: 'Cannot be empty'
	},
	{
		validate: (category: Category) => category.buttons.length === 0,
		message: 'Category must have at least one button'
	}
];

export const buttonValidationSchema = [
	{
		validate: (button: Button | Tag) => button.name.trim() === '',
		message: 'Cannot be empty'
	},
	{
		validate: (button: Button | Tag, idx: number, buttons: Button[] | Tag[]) => {
			const name = button.name.trim().toLowerCase();
			return (
				name &&
				buttons.filter((b, i) => b.name.trim().toLowerCase() === name && i !== idx).length > 0
			);
		},
		message: 'Names must be unique'
	}
];
