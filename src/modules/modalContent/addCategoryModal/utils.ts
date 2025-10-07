import { CategoryType } from '../../../components/box/types';
import type { Option } from '../../../utils/options';

export type InputRawContent = {
	firstSection: {
		name: string;
		inputs: {
			name: string;
			type: 'text' | 'color';
			placeholder?: string;
			inputClass?: string;
			formValue: string;
		}[];
	};
	secondSection: {
		name: string;
		tableHeaders: {
			[key in CategoryType]: { text: string; tooltip?: string }[];
		};
		tableInputs: {
			[key in CategoryType]: {
				type: 'input' | 'dropdown';
				size: 'medium' | 'small' | 'mini';
				name?: string;
				placeholder: string;
				options?: Option[];
				disabled?: boolean;
				value?: string | number;
				formValue: string;
			}[];
		};
	};
};

export const typeOptions: Option[] = [
	{
		value: 'FIXED',
		label: 'Fixed'
	},
	{
		value: 'DYNAMIC',
		label: 'Dynamic'
	}
];

export const secondsOptions: Option[] = [null, 1, 2, 3, 4, 5].map((num) => {
	return {
		value: num,
		label: `${num ? num + 's' : '-'}`
	};
});

export const inputRawContent = {
	firstSection: {
		name: 'Category settings',
		inputs: [
			{
				name: 'Name',
				type: 'text',
				placeholder: 'enter the name of the category',
				formValue: 'name'
			},
			{
				name: 'Color',
				type: 'color',
				inputClass: 'h-8! w-8! border-0 bg-transparent p-0!',
				formValue: 'color'
			}
		]
	},
	secondSection: {
		name: 'Button settings',
		tableHeaders: {
			[CategoryType.Event]: [{ text: 'Name' }, { text: 'Range' }],
			[CategoryType.Action]: [
				{ text: 'Name' },
				{ text: 'Range' },
				{
					text: 'Duration',
					tooltip: `Enabled ONLY when it is an action type: The duration of the button's action`
				},
				{ text: 'Before', tooltip: `Time lapse starting before the click` }
			]
		},
		tableInputs: {
			[CategoryType.Event]: [
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
					disabled: true,
					defaultValue: typeOptions[1].value,
					formValue: 'range'
				}
			],
			[CategoryType.Action]: [
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
	}
};
