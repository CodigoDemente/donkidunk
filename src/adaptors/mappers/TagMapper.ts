import type { Tag } from '../../modules/board/types/Tag';
import type { DatabaseTag } from '../types/DatabaseTag';

export class TagMapper {
	static toDomain(tag: DatabaseTag): Tag {
		return {
			id: tag.id,
			name: tag.name,
			color: tag.color
		};
	}

	static toPersistence(tag: Tag): DatabaseTag {
		return {
			id: tag.id,
			name: tag.name,
			color: tag.color
		};
	}
}
