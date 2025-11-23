import type { Option } from '../../../utils/options';

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
