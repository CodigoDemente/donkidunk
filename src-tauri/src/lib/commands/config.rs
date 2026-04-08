use log::debug;
use tauri::{Manager, Runtime};

use crate::{
    configmanager::{ButtonBoardWithPath, Config, UIMode},
    errors::AppError,
    license::{SubscriptionEntitlement, ensure_required_entitlement, has_entitlement},
    state::AppState,
};

#[tauri::command]
pub async fn get_user_config(state: tauri::State<'_, AppState>) -> Result<Config, AppError> {
    let config_manager = state.config_manager.lock().await;

    Ok(config_manager.get_config().clone())
}

#[tauri::command]
pub async fn get_button_boards<R: Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<Vec<ButtonBoardWithPath>, AppError> {
    debug!("Getting button boards");
    let state = app.state::<AppState>();

    let boards = {
        let config_manager = state.config_manager.lock().await;

        config_manager.get_button_board_paths()
    };

    crate::license::ensure_active_license(&app).await?;

    if !has_entitlement(&app, SubscriptionEntitlement::ViewPresetProboard).await? {
        debug!("No proboard entitlement, filtering boards");
        Ok(boards
            .into_iter()
            .filter(|board| {
                let board_name = board.button_board.name.to_lowercase();
                board_name != "professional coaching"
            })
            .collect())
    } else {
        debug!("Proboard entitlement, returning all boards");
        Ok(boards)
    }
}

#[tauri::command]
pub async fn save_button_board<R: Runtime>(
    app: tauri::AppHandle<R>,
    board_id: String,
    board_name: String,
    is_default: bool,
    board_content: String,
) -> Result<String, AppError> {
    ensure_required_entitlement(&app, SubscriptionEntitlement::SaveButtonBoard).await?;

    let state = app.state::<AppState>();

    let mut config_manager = state.config_manager.lock().await;

    let new_board_path = config_manager
        .save_button_board(board_id, board_name, is_default, board_content)
        .map_err(AppError::from)?;

    log::debug!(
        "Saved button board to: {}",
        new_board_path.to_string_lossy()
    );

    Ok(new_board_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn save_board_size(
    state: tauri::State<'_, AppState>,
    event_size: u8,
    tag_size: u8,
) -> Result<(), AppError> {
    let mut config_manager = state.config_manager.lock().await;

    config_manager.set_board_size(event_size, tag_size)?;

    Ok(())
}

#[tauri::command]
pub async fn save_ui_mode(
    state: tauri::State<'_, AppState>,
    ui_mode: UIMode,
) -> Result<(), AppError> {
    let mut config_manager = state.config_manager.lock().await;

    config_manager
        .set_ui_mode(ui_mode)
        .map_err(AppError::from)?;

    Ok(())
}
