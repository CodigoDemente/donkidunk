use crate::{
    errors::AppError,
    license::{SubscriptionEntitlement, ensure_required_entitlement},
    metrics::generate_metrics_csv,
    state::AppState,
};
use log::debug;
use tauri::{Manager, Runtime};

#[tauri::command]
pub async fn export_metrics_csv<R: Runtime>(
    app: tauri::AppHandle<R>,
    out_path: String,
) -> Result<(), AppError> {
    debug!("Invoking export_metrics_csv command");

    ensure_required_entitlement(&app, SubscriptionEntitlement::MetricsExport).await?;

    let state = app.state::<AppState>();

    let repository_guard = state.timeline_repository.lock().await;
    let timeline_repository = repository_guard.as_ref().unwrap();

    generate_metrics_csv(timeline_repository, &out_path).await
}
