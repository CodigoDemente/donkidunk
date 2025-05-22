import { writable } from 'svelte/store';

export interface Category {
	id: string;
	name: string;
	color: string;
	onGrid: number[];
	buttons: Action[];
}

export interface Action {
	id: string;
	name: string;
}

export interface Tag {
	id: string;
	name: string;
	color: string;
}
export interface BoardStore {
	isEditing: boolean;
	eventCategories: Category[];
	actionCategories: Category[];
	tagsRelatedToEvents: Tag[];
}

const initialState: BoardStore = {
	isEditing: false,
	eventCategories: [
		{
			id: '1',
			name: '',
			color: '#FFDD00',
			onGrid: [1, 1],
			buttons: [
				{
					id: '1-1',
					name: 'Attack'
				}
			]
		},
		{
			id: '2',
			name: '',
			color: '#FF0000',
			onGrid: [3, 4],
			buttons: [
				{
					id: '2-1',
					name: 'Defense'
				}
			]
		}
	],
	tagsRelatedToEvents: [
		{
			id: '#4',
			name: 'Whatever',
			color: '#FFDD00'
		},
		{
			id: '#5',
			name: 'Whatever3',
			color: '#FF0000'
		},
		{
			id: '#6',
			name: 'Whatever4',
			color: '#FF0000'
		}
	],
	actionCategories: [
		{
			id: '13',
			name: 'Shoots',
			color: '#924F97',
			onGrid: [5, 6],
			buttons: [
				{
					id: '13-1',
					name: 'One point shoot'
				},
				{
					id: '13-2',
					name: 'Two point shoot'
				},
				{
					id: '13-3',
					name: 'Three point shoot'
				}
			]
		},
		{
			id: '14',
			name: 'System',
			color: '#FF5009',
			onGrid: [7, 8],
			buttons: [
				{
					id: '14-5',
					name: 'System A'
				},
				{
					id: '14-6',
					name: 'System B'
				},
				{
					id: '14-7',
					name: 'System C'
				}
			]
		},
		{
			id: '15',
			name: 'Defense Systems',
			color: '#3357FF',
			onGrid: [9, 10],
			buttons: [
				{
					id: '15-1',
					name: 'Block'
				},
				{
					id: '15-2',
					name: 'Screen'
				},
				{
					id: '15-3',
					name: 'Player 3'
				}
			]
		},
		{
			id: '16',
			name: 'Other Category',
			color: '#FF33A1',
			onGrid: [11, 4],
			buttons: [
				{
					id: '16-1',
					name: 'Player 1'
				},
				{
					id: '16-2',
					name: 'Player 2'
				},
				{
					id: '16-3',
					name: 'Player 3'
				}
			]
		},
		{
			id: '17',
			name: 'Techniques',
			color: '#FF8C33',
			onGrid: [12, 3],
			buttons: [
				{
					id: '17-1',
					name: 'Fast break'
				},
				{
					id: '17-2',
					name: 'Isolation'
				}
			]
		}
	]
};

export const boardStore = writable<BoardStore>(initialState);
