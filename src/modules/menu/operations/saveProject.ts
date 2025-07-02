import { dumpIntoOriginalDatabase } from '../../../persistence/database/actions';
import { projectActions } from '../../../persistence/stores/project/actions';

export async function saveProject() {
	const timeStamp = new Date().toISOString();

	await projectActions.setLastSavedTimestamp(timeStamp);

	await dumpIntoOriginalDatabase(projectActions.getFilePath());
}
