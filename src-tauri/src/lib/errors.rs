use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    Ffmpeg(#[from] FfmpegError),

    #[error("{0}")]
    ConfigManager(#[from] ConfigError),

    #[error(transparent)]
    ApplicationError(#[from] tauri::Error),

    #[error("{0}")]
    DatabaseError(#[from] DatabaseError),

    #[error(transparent)]
    DateError(#[from] chrono::ParseError),

    #[error("[io] ERROR Failed to open file: {0}")]
    IoError(String),

    #[error("{0}")]
    CsvError(#[from] CsvError),

    #[error(transparent)]
    Unexpected(#[from] anyhow::Error),

    #[error(transparent)]
    AuthError(#[from] AuthError),
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

#[derive(Debug, Error)]
pub enum DatabaseError {
    #[error("[database] ERROR while executing database operation: {0}")]
    SqlError(#[from] sqlx::Error),

    #[error("[database] ERROR pending references to the DB object")]
    PendingReferences,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum CsvError {
    #[error("[csv] ERROR while writing CSV file: {0}")]
    WriteError(String),
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum AuthError {
    #[error("[auth] Error processing deepling: {0}")]
    DeeplinkMalformed(String),

    #[error("[auth] Error processing request response")]
    BodyError,

    #[error("[auth] Error connecting to auth server")]
    ConnectivityError,

    #[error("[auth] Invalid credentials")]
    InvalidCredentials,

    #[error("[auth] Invalid request")]
    InvalidRequest,

    #[error("[auth] Unexepected error while authenticating the user")]
    UnexepectedAuthError,

    #[error("[auth] Error while storing credential: {0}")]
    CredentialStoreError(String),

    #[error("[auth] Credential not found: {0}")]
    CredentialNotFound(String),

    #[error("[auth] Error decoding token")]
    TokenDecodeError,

    #[error(transparent)]
    LicenseError(#[from] LicenseError),
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum LicenseError {
    #[error("[license] Error processing request response")]
    BodyError,

    #[error("[license] Error connecting to license server")]
    ConnectivityError,

    #[error("[license] Invalid credentials")]
    InvalidCredentials,

    #[error("[license] Invalid request")]
    InvalidRequest,

    #[error("[license] Subscription inactive")]
    SubscriptionInactive,

    #[error("[license] No license data present")]
    NoLicenseData,

    #[error("[license] Insufficient features")]
    InsufficientFeatures,

    #[error("[license] Unexepected error while getting the user license")]
    Unexepected,
}
