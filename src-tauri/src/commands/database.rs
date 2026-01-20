use lib::{
    errors::{AppError, DatabaseError},
    state::{AppState, AppStateTrait},
};
use log::debug;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn set_database_conn(
    state: tauri::State<'_, Mutex<AppState>>,
    database_path: String,
) -> Result<bool, AppError> {
    debug!("Setting database connection to: {}", database_path);

    let pool = sqlx::SqlitePool::connect(&database_path)
        .await
        .map_err(DatabaseError::from)?;

    let mut state = state.lock().await;

    state.set_db(pool.clone()).await?;

    Ok(true)
}

#[tauri::command]
pub async fn disconnect_database(
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<bool, AppError> {
    debug!("Disconnecting database");

    let mut state = state.lock().await;

    state.disconnect_db().await?;

    Ok(true)
}
