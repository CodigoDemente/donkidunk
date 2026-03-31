use std::fs;

use chrono::{DateTime, Duration, NaiveDateTime, Utc};
use jsonwebtoken::DecodingKey;
use log::error;
use sqlx::SqlitePool;
use tauri::{App, Manager, Runtime};
use tokio::sync::Mutex;

use crate::{
    auth::{AUTH_CREDENTIAL, decode_token, retrieve_credentials},
    configmanager::ConfigManager,
    errors::{AppError, AuthError},
    license::{LICENSE_CREDENTIAL, SubscriptionStatus, retrieve_license_credential},
    scheduler::Scheduler,
    securestore::SecureStore,
    tasks::{AUTH_TASK_NAME, LICENSE_RENEWAL_TASK_NAME},
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

#[derive(Debug)]
pub struct License {
    pub last_validation: DateTime<Utc>,
    pub user_id: String,
    pub user_email: String,
    pub user_name: String,
    pub subscription_id: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub status: Option<SubscriptionStatus>,
    pub features: Option<Vec<String>>,
}

pub struct Tasks {
    pub last_license_check: NaiveDateTime,
    pub last_login_check: NaiveDateTime,
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
    pub tasks: Mutex<Tasks>,
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

        let secure_store = SecureStore::new_with_targets(
            username,
            vec![AUTH_CREDENTIAL.to_string(), LICENSE_CREDENTIAL.to_string()],
        )?;

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

        let auth_credentials = retrieve_credentials(&secure_store);

        if let Some(auth_credentials) = auth_credentials {
            let token_claims = decode_token(&jwt_key, &auth_credentials.access_token, true);
            match token_claims {
                Ok(token_claims) => {
                    authentication.access_token = auth_credentials.access_token;
                    authentication.refresh_token = auth_credentials.refresh_token;
                    authentication.expires_at =
                        DateTime::from_timestamp_millis(auth_credentials.expires_at)
                            .unwrap_or_default();
                    authentication.expires_in = auth_credentials.expires_in;

                    authentication.is_authenticated = true;

                    license = Some(License {
                        last_validation: DateTime::from_timestamp_secs(token_claims.iat)
                            .unwrap_or(Utc::now() - Duration::weeks(1)),
                        user_id: token_claims.sub,
                        user_email: token_claims.email,
                        user_name: token_claims.name,
                        subscription_id: None,
                        status: None,
                        expires_at: None,
                        features: None,
                    });
                }
                Err(err) => {
                    error!("Error decoding stored auth credentials, ignoring them: {err}");
                }
            }
        }

        let license_credentials = retrieve_license_credential(&secure_store);

        if let Some(license_credentials) = license_credentials
            && let Some(license) = license.as_mut()
        {
            license.subscription_id = Some(license_credentials.subscription_id);
            license.status = Some(license_credentials.status);
            license.expires_at = DateTime::from_timestamp_millis(license_credentials.expires_at);
            license.last_validation =
                DateTime::from_timestamp_millis(license_credentials.checked_at)
                    .unwrap_or(Utc::now() - Duration::days(1));
            license.features = Some(license_credentials.features);
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
            tasks: Mutex::new(Tasks {
                last_license_check: (Utc::now() - Duration::days(1)).naive_utc(),
                last_login_check: (Utc::now() - Duration::days(1)).naive_utc(),
            }),
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

    pub async fn logout(&self) -> Result<(), AuthError> {
        self.reset_oauth_flow().await;

        {
            let mut auth_guard = self.authentication.lock().await;
            auth_guard.is_authenticated = false;
            auth_guard.access_token = String::default();
            auth_guard.refresh_token = String::default();
            auth_guard.expires_at = Utc::now();
        }

        {
            let mut license_guard = self.license.lock().await;
            *license_guard = None;
        }

        {
            let mut store_guard = self.secure_store.lock().await;
            store_guard.delete_entry(AUTH_CREDENTIAL.to_string())?;
            store_guard.delete_entry(LICENSE_CREDENTIAL.to_string())?;
        }

        let mut scheduler_guard = self.scheduler.lock().await;
        scheduler_guard.stop_task(AUTH_TASK_NAME.to_string()).await;
        scheduler_guard
            .stop_task(LICENSE_RENEWAL_TASK_NAME.to_string())
            .await;

        Ok(())
    }
}
