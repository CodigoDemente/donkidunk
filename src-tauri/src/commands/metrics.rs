use lib::{
    errors::AppError,
    metrics::generate_clips_csv,
    state::{AppState, AppStateTrait},
};
use log::debug;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn export_clips_csv(
    state: tauri::State<'_, Mutex<AppState>>,
    out_path: String,
) -> Result<(), AppError> {
    debug!("Invoking export_clips_csv command");

    let state = &state.lock().await;

    let timeline_repository = state.get_timeline_repository().unwrap();

    generate_clips_csv(timeline_repository, &out_path).await?;

    Ok(())
}
