use lib::{
    errors::AppError,
    ffmpeg::{self, ExportEvent},
};
use tauri::{ipc::Channel, Runtime};

#[tauri::command]
pub async fn cut_video<R: Runtime>(
    app: tauri::AppHandle<R>,
    video_path: String,
    out_path: String,
    ranges: Vec<(f32, f32)>,
    on_event: Channel<ExportEvent>,
) -> Result<(), AppError> {
    let ffmpeg = ffmpeg::Ffmpeg::new(&app, on_event)?;

    ffmpeg.export_video(&video_path, &out_path, &ranges).await
}
