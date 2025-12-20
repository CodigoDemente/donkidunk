use lib::{
    configmanager::{ButtonBoardWithPath, Config, ConfigManagerTrait, UIMode},
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

    let new_board_path =
        config_manager.save_button_board(board_id, board_name, is_default, board_content)?;

    log::debug!(
        "Saved button board to: {}",
        new_board_path.to_string_lossy()
    );

    Ok(new_board_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn save_board_size(
    state: tauri::State<'_, AppState>,
    event_size: u8,
    tag_size: u8,
) -> Result<(), AppError> {
    state
        .config_manager
        .lock()
        .unwrap()
        .set_board_size(event_size, tag_size)?;

    Ok(())
}

#[tauri::command]
pub fn save_ui_mode(state: tauri::State<'_, AppState>, ui_mode: UIMode) -> Result<(), AppError> {
    state.config_manager.lock().unwrap().set_ui_mode(ui_mode)?;

    Ok(())
}
