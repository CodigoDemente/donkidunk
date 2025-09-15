import { secondsOptions, typeOptions } from '../../utils/options';

export const inputRawContent = {
	firstSection: {
		name: 'Category settings',
		inputs: [
			{
				name: 'Name',
				placeholder: 'enter the name of the category',
				formValue: 'categoryName'
			},
			{
				name: 'Color',
				type: 'color',
				inputClass: 'h-8! w-8! border-0 bg-transparent p-0!',
				formValue: 'categoryColor'
			}
		]
	},
	secondSection: {
		name: 'Button settings',
		tableHeaders: [
			{ text: 'Name' },
			{ text: 'Range' },
			{
				text: 'Duration',
				tooltip: `Enabled ONLY when it is an action type: The duration of the button's action`
			},
			{ text: 'Before', tooltip: `Time lapse starting before the click` }
		],
		tableInputs: [
			{
				type: 'input',
				size: 'medium',
				placeholder: 'Write here the button name...',
				formValue: 'name'
			},
			{
				type: 'dropdown',
				size: 'small',
				placeholder: 'Select range',
				options: typeOptions,
				formValue: 'range'
			},
			{
				type: 'dropdown',
				size: 'mini',
				placeholder: 'Select',
				options: secondsOptions,
				formValue: 'duration'
			},
			{
				type: 'dropdown',
				name: 'before',
				size: 'mini',
				placeholder: 'Select',
				options: secondsOptions,
				formValue: 'before'
			}
		]
	}
};
