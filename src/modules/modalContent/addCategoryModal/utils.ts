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

export const secondsDurationOptions: Option[] = [
	null,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20
].map((num) => {
	return {
		value: num,
		label: `${num ? num + 's' : '-'}`
	};
});

export const secondsBeforeOptions: Option[] = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
	return {
		value: num,
		label: `${num ? num + 's' : '-'}`
	};
});
