use lib::{
    errors::AppError,
    state::{AppState, AppStateTrait},
};
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_is_expired(state: tauri::State<'_, Mutex<AppState>>) -> Result<bool, AppError> {
    let state = &state.lock().await;

    Ok(state.get_is_expired())
}
