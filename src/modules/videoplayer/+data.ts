export interface TagsData {
	categoryId: string;
	name: string;
	color: string;
	tags: {
		tagId: string;
		name: string;
		timestamp: number[][];
	}[];
}

export const fakeDataTags: TagsData[] = [
	{
		name: 'Systems',
		categoryId: '12',
		color: '#FF5009',
		tags: [
			{
				tagId: '1',
				name: 'System A',
				timestamp: [[101.0, 202.0]]
			},
			{
				tagId: '2',
				name: 'System B',
				timestamp: [[202.0, 245.0]]
			},
			{
				tagId: '3',
				name: 'System C',
				timestamp: [[345.0, 380.0]]
			}
		]
	},
	{
		name: 'Shoots',
		categoryId: '13',
		color: '#924F97',
		tags: [
			{
				tagId: '1',
				name: 'One point shoot',
				timestamp: [[13.0, 15.0]]
			},
			{
				tagId: '2',
				name: 'Two point shoot',
				timestamp: [
					[20.0, 25.0],
					[30.0, 35.0],
					[40.0, 45.0],
					[50.0, 55.0]
				]
			},
			{
				tagId: '3',
				name: 'Three point shoot',
				timestamp: [
					[60.0, 65.0],
					[70.0, 75.0],
					[80.0, 85.0],
					[90.0, 95.0]
				]
			}
		]
	},
	{
		name: 'Defense system',
		categoryId: '14',
		color: '#3357FF',
		tags: [
			{
				tagId: '1',
				name: 'Block',
				timestamp: [[18.0, 22.0]]
			},
			{
				tagId: '2',
				name: 'Screen',
				timestamp: [[1292.0, 1295.0]]
			},
			{
				tagId: '3',
				name: 'Player 3',
				timestamp: [[694.0, 698.0]]
			}
		]
	},
	{
		name: 'Other category',
		categoryId: '15',
		color: '#FF33A1',
		tags: [
			{
				tagId: '1',
				name: 'Player 1',
				timestamp: [[212.0, 218.0]]
			},
			{
				tagId: '2',
				name: 'Player 2',
				timestamp: [[304.0, 308.0]]
			},
			{
				tagId: '3',
				name: 'Player 3',
				timestamp: [[412.0, 422.0]]
			}
		]
	},
	{
		name: 'Techniques',
		categoryId: '16',
		color: '#FF8C33',
		tags: [
			{
				tagId: '1',
				name: 'Fast break',
				timestamp: [[11.0, 22.0]]
			},
			{
				tagId: '2',
				name: 'Isolation',
				timestamp: [[1292.0, 1493.0]]
			},
			{
				tagId: '3',
				name: 'Rebound',
				timestamp: [[678.0, 690.0]]
			}
		]
	}
];
