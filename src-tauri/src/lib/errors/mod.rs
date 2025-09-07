use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    Ffmpeg(#[from] FfmpegError),

    #[error(transparent)]
    ApplicationError(#[from] tauri::Error),

    #[error(transparent)]
    Unexpected(#[from] anyhow::Error),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[derive(Debug, Error)]
pub enum FfmpegError {
    #[error("[ffmpeg-sidecar] ERROR Could not capture stderr")]
    StderrCapture,

    #[error("[ffmpeg-sidecar] ERROR Failed to access FFMPEG sidecar: {0}")]
    FfmpegSidecarAccess(String),

    #[error("[ffmpeg-sidecar] ERROR FFMPEG command failed: {0}")]
    FfmpegCommandFailed(#[from] std::io::Error),

    #[error("[ffmpeg-sidecar] ERROR FFMPEG spawn failed: {0}")]
    FfmpegSpawnFailed(#[from] tokio::task::JoinError),

    #[error("[ffmpeg-sidecar] ERROR FFMPEG execution failed: {0}")]
    FfmpegExecution(String),

    #[error("[ffmpeg-cleanup] ERROR FMMPEG cleanup failed: {0}")]
    FfmpegCleanupFailed(String),
}
