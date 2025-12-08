use lib::{
    configmanager::{ButtonBoardWithPath, Config, ConfigManagerTrait},
    errors::AppError,
};

use crate::AppState;

#[tauri::command]
pub fn get_user_config(state: tauri::State<'_, AppState>) -> Result<Config, AppError> {
    let config_manager = &state.config_manager.lock().unwrap();

    Ok(config_manager.get_config().clone())
}

#[tauri::command]
pub fn get_button_boards(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ButtonBoardWithPath>, AppError> {
    let config_manager = &state.config_manager.lock().unwrap();

    Ok(config_manager.get_button_board_paths())
}

#[tauri::command]
pub fn save_button_board(
    state: tauri::State<'_, AppState>,
    board_id: String,
    board_name: String,
    is_default: bool,
    board_content: String,
) -> Result<String, AppError> {
    let mut config_manager = state.config_manager.lock().unwrap();

    let new_board_path = config_manager.save_button_board(board_id, board_name, is_default, board_content)?;

    log::debug!("Saved button board to: {}", new_board_path.to_string_lossy());

    Ok(new_board_path.to_string_lossy().to_string())
}
