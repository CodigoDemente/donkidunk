use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    Ffmpeg(#[from] FfmpegError),

    #[error("{0}")]
    ConfigManager(#[from] ConfigError),

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

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("[config-manager] ERROR getting config value, not found: {0}")]
    ConfigValueNotFound(String),

    #[error("[config-manager] ERROR reading or writing configuration: {0}")]
    ConfigIOError(#[from] std::io::Error),

    #[error("[config-manager] ERROR serializing or deserializing config: {0}")]
    ConfigSerializationError(#[from] serde_json::Error),

    #[error("[config-manager] ERROR getting config dir: {0}")]
    ConfigGenericError(#[from] tauri::Error),

    #[error("[config-manager] ERROR invalid board size: {0}")]
    InvalidBoardSize(String),
}
