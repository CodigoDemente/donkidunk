import type { Button } from '../../modules/board/types/Button';
import type { DatabaseButton } from '../types/DatabaseButton';

export class ButtonMapper {
	static toPersistence(button: Button): DatabaseButton {
		return {
			id: button.id,
			name: button.name,
			range: button.range!.valueOf(),
			duration: button.duration,
			before: button.before,
			color: button.color
		};
	}
}
