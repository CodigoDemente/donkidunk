import { dumpIntoOriginalDatabase } from '../../../persistence/database/actions';
import { getFilePath, setLastSavedTimestamp } from '../../../persistence/stores/project/actions';

export async function saveProject() {
	const timeStamp = new Date().toISOString();

	await setLastSavedTimestamp(timeStamp);

	await dumpIntoOriginalDatabase(getFilePath());
}
