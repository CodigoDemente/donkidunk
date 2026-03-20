use std::fs;

use chrono::{DateTime, Duration, Utc};
use jsonwebtoken::DecodingKey;
use log::error;
use sqlx::SqlitePool;
use tauri::{App, Manager, Runtime};
use tokio::sync::Mutex;

use crate::{
    auth::{LOGIN_TASK_NAME, decode_token, retrieve_credentials},
    configmanager::ConfigManager,
    errors::AppError,
    scheduler::Scheduler,
    securestore::SecureStore,
    timelinerepository::TimelineRepository,
};

pub struct Oauth {
    pub code_challenge: String,
    pub code_verifier: String,
    pub state: String,
}

pub struct Authentication {
    pub is_authenticated: bool,
    pub oauth: Oauth,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: DateTime<Utc>,
    pub expires_in: i64,
}

pub struct License {
    pub last_validation: DateTime<Utc>,
    pub user_id: String,
    pub user_email: String,
    pub user_name: String,
}

pub struct AppState {
    pub config_manager: Mutex<ConfigManager>,
    db: Mutex<Option<SqlitePool>>,
    pub timeline_repository: Mutex<Option<TimelineRepository>>,
    pub authentication: Mutex<Authentication>,
    pub license: Mutex<Option<License>>,
    pub jwt_key: DecodingKey,
    pub secure_store: Mutex<SecureStore>,
    pub scheduler: Mutex<Scheduler>,
}

impl AppState {
    pub fn new<R: Runtime>(app: &App<R>) -> Result<Self, AppError> {
        let mut config_manager = ConfigManager::new(app);
        config_manager.initialize_button_boards(app).unwrap();

        let username = match whoami::username() {
            Ok(username) => username,
            Err(err) => {
                error!("Error retrieving username for state: {err}");

                String::from("donkidunk-user")
            }
        };

        let secure_store = SecureStore::new(username)?;

        let stored_credentials = retrieve_credentials(&secure_store);

        let key_path = app.path().resolve(
            "assets/keys/public_key.pem",
            tauri::path::BaseDirectory::Resource,
        )?;

        let key_contents = fs::read(key_path).map_err(|e| {
            error!("Error reading public key: {e}");
            AppError::Unexpected(e.into())
        })?;

        let mut authentication = Authentication {
            is_authenticated: false,
            oauth: Oauth {
                code_challenge: String::new(),
                code_verifier: String::new(),
                state: String::new(),
            },
            access_token: String::default(),
            refresh_token: String::default(),
            expires_at: DateTime::default(),
            expires_in: 0,
        };

        let jwt_key = DecodingKey::from_rsa_pem(&key_contents).map_err(|e| {
            error!("Error creating public key: {e}");

            AppError::Unexpected(e.into())
        })?;

        let mut license = None;

        if let Some(stored_credentials) = stored_credentials {
            authentication.access_token = stored_credentials.access_token;
            authentication.refresh_token = stored_credentials.refresh_token;
            authentication.expires_at =
                DateTime::from_timestamp_millis(stored_credentials.expires_at).unwrap_or_default();
            authentication.expires_in = stored_credentials.expires_in;

            authentication.is_authenticated = true;

            let token_claims = decode_token(&jwt_key, &authentication.access_token)?;

            license = Some(License {
                last_validation: DateTime::from_timestamp_secs(token_claims.iat)
                    .unwrap_or(Utc::now() - Duration::weeks(1)),
                user_id: token_claims.sub,
                user_email: token_claims.email,
                user_name: token_claims.name,
            });
        }

        Ok(Self {
            config_manager: Mutex::new(config_manager),
            // Always lock from specific to generic.
            // First lock repository, second db.
            // If we all respect this, we are safe (regarding deadlocks)
            db: Mutex::new(None),
            timeline_repository: Mutex::new(None),
            jwt_key,
            authentication: Mutex::new(authentication),
            secure_store: Mutex::new(secure_store),
            scheduler: Mutex::new(Scheduler::new()),
            license: Mutex::new(license),
        })
    }

    pub async fn set_db(&self, db: SqlitePool) -> Result<(), AppError> {
        let mut repository_guard = self.timeline_repository.lock().await;
        let mut conn_guard = self.db.lock().await;

        if let Some(old_conn) = conn_guard.take() {
            old_conn.close().await;
        }

        *repository_guard = Some(TimelineRepository::new(db.clone()));
        *conn_guard = Some(db);

        Ok(())
    }

    pub async fn disconnect_db(&self) -> Result<(), AppError> {
        let mut repository_guard = self.timeline_repository.lock().await;
        let mut conn_guard = self.db.lock().await;

        if let Some(db) = conn_guard.take() {
            db.close().await;
        }

        *repository_guard = None;
        *conn_guard = None;

        Ok(())
    }

    pub async fn reset_oauth_flow(&self) {
        let mut auth_mutex = self.authentication.lock().await;

        auth_mutex.oauth = Oauth {
            code_challenge: String::default(),
            code_verifier: String::default(),
            state: String::default(),
        }
    }

    pub async fn logout(&self) -> Result<(), AppError> {
        let mut auth_guard = self.authentication.lock().await;
        let store_guard = self.secure_store.lock().await;
        let mut scheduler_guard = self.scheduler.lock().await;

        auth_guard.is_authenticated = false;
        auth_guard.access_token = String::default();
        auth_guard.refresh_token = String::default();
        auth_guard.expires_at = Utc::now();

        store_guard.delete_entry()?;

        scheduler_guard.stop_task(LOGIN_TASK_NAME.to_string());

        Ok(())
    }
}
