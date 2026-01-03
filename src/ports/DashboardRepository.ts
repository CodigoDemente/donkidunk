import type { EventUsage } from '../modules/metrics/types/EventUsage';
import type { TagUsage } from '../modules/metrics/types/TagUsage';

export interface DashboardRepository {
	getEventsUsed(): Promise<EventUsage[]>;
	getTagsUsed(): Promise<TagUsage[]>;
}
