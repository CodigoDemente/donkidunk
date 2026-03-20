use crate::{
    errors::{AppError, DatabaseError},
    state::AppState,
};
use log::debug;

#[tauri::command]
pub async fn set_database_conn(
    state: tauri::State<'_, AppState>,
    database_path: String,
) -> Result<bool, AppError> {
    debug!("Setting database connection to: {}", database_path);

    let pool = sqlx::SqlitePool::connect(&database_path)
        .await
        .map_err(DatabaseError::from)?;

    state.set_db(pool.clone()).await?;

    Ok(true)
}

#[tauri::command]
pub async fn disconnect_database(state: tauri::State<'_, AppState>) -> Result<bool, AppError> {
    debug!("Disconnecting database");

    state.disconnect_db().await?;

    Ok(true)
}
