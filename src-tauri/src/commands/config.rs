use lib::{configmanager::Config, errors::AppError};

use crate::AppState;

#[tauri::command]
pub fn get_user_config(state: tauri::State<'_, AppState>) -> Result<Config, AppError> {
    let config_manager = &state.config_manager;

    Ok(*config_manager.get_config())
}
