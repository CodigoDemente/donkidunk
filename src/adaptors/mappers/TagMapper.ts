import type { Tag } from '../../modules/board/types/Tag';
import type { DatabaseTag } from '../types/DatabaseTag';

export class TagMapper {
	static toPersistence(tag: Tag): DatabaseTag {
		return {
			id: tag.id,
			name: tag.name,
			color: tag.color
		};
	}
}
