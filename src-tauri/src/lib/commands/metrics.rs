use crate::{errors::AppError, metrics::generate_clips_csv, state::AppState};
use log::debug;

#[tauri::command]
pub async fn export_clips_csv(
    state: tauri::State<'_, AppState>,
    out_path: String,
) -> Result<(), AppError> {
    debug!("Invoking export_clips_csv command");

    let repository_guard = state.timeline_repository.lock().await;
    let timeline_repository = repository_guard.as_ref().unwrap();

    generate_clips_csv(timeline_repository, &out_path).await?;

    Ok(())
}
