import type { Tag } from './types/Tag';

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
