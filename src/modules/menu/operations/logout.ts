import { appActions } from '../../../persistence/stores/app/actions';
import { logoutCommand } from '../commands/Logout';
import { closeDatabaseAndSaveChanges } from './closeProject';

export async function logout(): Promise<void> {
	await closeDatabaseAndSaveChanges();

	await logoutCommand();

	appActions.setIsAuthenticated(false);
}
