use std::{fmt::Display, str::FromStr};

use axum::http::StatusCode;
use chrono::{DateTime, Utc};
use log::error;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_http::reqwest;
use tokio::sync::MutexGuard;
use uuid::Uuid;

use crate::{
    API_URL, ApiEnvelopeResponse, HTTP_CLIENT,
    auth::UserData,
    errors::{AuthError, LicenseError},
    securestore::SecureStore,
    state::{AppState, License},
    tasks::{LICENSE_RENEWAL_TASK_NAME, perform_license_check},
};

pub const LICENSE_CREDENTIAL: &str = "license";

#[derive(Debug, Serialize, Deserialize)]
pub struct StoredLicenseCredential {
    pub subscription_id: String,
    pub status: SubscriptionStatus,
    pub expires_at: i64, //Millis
    pub checked_at: i64, // Millis
    pub features: Vec<SubscriptionEntitlement>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LicenseStateEvent {
    subscription_id: String,
    status: String,
    expires_at: i64,
    features: Vec<SubscriptionEntitlement>,
}

#[derive(Deserialize, Clone)]
pub struct LicenseResponse {
    pub subscription_id: String,
    pub subscription_status: String,
    pub next_billing_date: String,
    pub features: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SubscriptionStatus {
    Active,
    Paused,
    Trialing,
    Inactive,
}

impl Display for SubscriptionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let value = match self {
            Self::Active => "active",
            Self::Inactive => "inactive",
            Self::Paused => "paused",
            Self::Trialing => "trialing",
        };

        write!(f, "{value}")
    }
}

impl From<String> for SubscriptionStatus {
    fn from(value: String) -> Self {
        if value == "active" {
            Self::Active
        } else if value == "inactive" {
            Self::Inactive
        } else if value == "paused" {
            Self::Paused
        } else if value == "trialing" {
            Self::Trialing
        } else {
            Self::Inactive
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SubscriptionEntitlement {
    TextOnExport,
    SaveButtonBoard,
    ViewPresetProboard,
    TagsView,
    ClipGallery,
    MetricsExport,
    Unknown,
}

impl Display for SubscriptionEntitlement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let value = match self {
            Self::TextOnExport => "text_on_export",
            Self::SaveButtonBoard => "save_button_board",
            Self::ViewPresetProboard => "view_preset_proboard",
            Self::TagsView => "tags_view",
            Self::ClipGallery => "clip_gallery",
            Self::MetricsExport => "metrics_expor",
            Self::Unknown => "unknown",
        };

        write!(f, "{value}")
    }
}

impl From<String> for SubscriptionEntitlement {
    fn from(value: String) -> Self {
        value.as_str().into()
    }
}

impl From<&String> for SubscriptionEntitlement {
    fn from(value: &String) -> Self {
        value.as_str().into()
    }
}

impl From<&str> for SubscriptionEntitlement {
    fn from(value: &str) -> Self {
        if value == "text_on_export" {
            Self::TextOnExport
        } else if value == "save_button_board" {
            Self::SaveButtonBoard
        } else if value == "view_preset_proboard" {
            Self::ViewPresetProboard
        } else if value == "tags_view" {
            Self::TagsView
        } else if value == "clip_gallery" {
            Self::ClipGallery
        } else if value == "metrics_expor" {
            Self::MetricsExport
        } else {
            Self::Unknown
        }
    }
}

#[derive(Clone)]
pub struct Subscription {
    pub subscription_id: Uuid,
    pub subscription_status: SubscriptionStatus,
    pub next_billing_date: DateTime<Utc>,
    pub features: Vec<SubscriptionEntitlement>,
}

pub fn build_license_url(user_id: &str) -> String {
    format!("{API_URL}/user/{user_id}/license")
}

fn map_license_err(error: reqwest::Error) -> LicenseError {
    error!("Error while trying to check license: {error}");

    if error.is_body() || error.is_decode() {
        LicenseError::BodyError
    } else if error.is_connect() || error.is_timeout() {
        LicenseError::ConnectivityError
    } else {
        LicenseError::Unexepected
    }
}

pub async fn get_user_license(
    user_id: String,
    access_token: &str,
) -> Result<Subscription, LicenseError> {
    let response = HTTP_CLIENT
        .get(build_license_url(&user_id))
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(map_license_err)?;

    let status = response.status();

    if status.is_client_error() || status.is_server_error() {
        let text = response.text().await.map_err(map_license_err)?;

        error!("Error from license server: {status} {text}");

        match status {
            StatusCode::BAD_REQUEST => return Err(LicenseError::InvalidRequest),
            StatusCode::UNAUTHORIZED => return Err(LicenseError::InvalidCredentials),
            StatusCode::NOT_FOUND => return Err(LicenseError::SubscriptionInactive),
            _ => return Err(LicenseError::Unexepected),
        }
    }

    let json_body = response
        .json::<ApiEnvelopeResponse<LicenseResponse>>()
        .await
        .map_err(map_license_err)?;

    let subscription_data = json_body.data;

    let subscription_id = match Uuid::from_str(&subscription_data.subscription_id) {
        Ok(id) => id,
        Err(e) => {
            error!("Error parsing subscription_id: {e}");

            return Err(LicenseError::BodyError);
        }
    };

    let next_billing_date = match DateTime::parse_from_rfc3339(&subscription_data.next_billing_date)
    {
        Ok(date) => date.to_utc(),
        Err(e) => {
            error!("Error parsing next billing date: {e}");

            return Err(LicenseError::BodyError);
        }
    };

    let subscription_status = SubscriptionStatus::from(subscription_data.subscription_status);
    let features = subscription_data
        .features
        .iter()
        .map(SubscriptionEntitlement::from)
        .collect();

    Ok(Subscription {
        subscription_id,
        subscription_status,
        next_billing_date,
        features,
    })
}

pub fn retrieve_license_credential(secure_store: &SecureStore) -> Option<StoredLicenseCredential> {
    let Ok(stored_credentials) = secure_store.get_entry(LICENSE_CREDENTIAL.to_string()) else {
        return None;
    };

    let credentials = match serde_json::from_str::<StoredLicenseCredential>(&stored_credentials) {
        Ok(credentials) => credentials,
        Err(e) => {
            error!("Error parsing license credentials from store: {e}");
            return None;
        }
    };

    Some(credentials)
}

pub fn store_license(
    user_data: UserData,
    subscription: Subscription,
    mut license_guard: MutexGuard<'_, Option<License>>,
    mut secure_store: MutexGuard<'_, SecureStore>,
) -> Result<(), AuthError> {
    let credentials = serde_json::to_string(&StoredLicenseCredential {
        subscription_id: subscription.subscription_id.to_string(),
        status: subscription.subscription_status,
        expires_at: subscription.next_billing_date.timestamp_millis(),
        checked_at: user_data.last_verified_time.timestamp_millis(),
        features: subscription.features.clone(),
    })
    .map_err(|e| {
        error!("Error serializing credentials: {e}");

        LicenseError::Unexepected
    })?;

    secure_store.create_entry(LICENSE_CREDENTIAL.to_string(), credentials)?;

    *license_guard = Some(License {
        last_validation: user_data.last_verified_time,
        user_id: user_data.user_id,
        user_email: user_data.user_email,
        user_name: user_data.user_name,
        subscription_id: Some(subscription.subscription_id.to_string()),
        status: Some(subscription.subscription_status),
        expires_at: Some(subscription.next_billing_date),
        features: Some(subscription.features),
    });

    Ok(())
}

pub async fn notify_expired_license<R: Runtime>(
    app: &AppHandle<R>,
    subscription: Subscription,
) -> Result<(), LicenseError> {
    app.emit(
        "license:inactive",
        LicenseStateEvent {
            subscription_id: subscription.subscription_id.to_string(),
            status: subscription.subscription_status.to_string(),
            expires_at: subscription.next_billing_date.timestamp_millis(),
            features: subscription.features,
        },
    )
    .map_err(|e| {
        error!("Error emitting license expired events: {e}");
        LicenseError::Unexepected
    })?;

    Ok(())
}

pub async fn notify_active_license<R: Runtime>(
    app: &AppHandle<R>,
    subscription: Subscription,
) -> Result<(), LicenseError> {
    app.emit(
        "license:active",
        LicenseStateEvent {
            subscription_id: subscription.subscription_id.to_string(),
            status: subscription.subscription_status.to_string(),
            expires_at: subscription.next_billing_date.timestamp_millis(),
            features: subscription.features,
        },
    )
    .map_err(|e| {
        error!("Error emitting license active events: {e}");
        LicenseError::Unexepected
    })?;

    Ok(())
}

pub async fn ensure_active_license<R: Runtime>(app: &AppHandle<R>) -> Result<(), AuthError> {
    let state = app.state::<AppState>();
    let err = Err(Into::<AuthError>::into(LicenseError::SubscriptionInactive));

    {
        let scheduler = state.scheduler.lock().await;

        if scheduler.has_task(LICENSE_RENEWAL_TASK_NAME).await {
            return err;
        }
    }

    let user_data: UserData = {
        let license_guard = state.license.lock().await;

        if let Some(license) = license_guard.as_ref() {
            let auth_guard = state.authentication.lock().await;
            UserData {
                user_id: license.user_id.clone(),
                user_email: license.user_email.clone(),
                user_name: license.user_name.clone(),
                access_token: auth_guard.access_token.clone(),
                last_verified_time: license.last_validation,
            }
        } else {
            return err;
        }
    };

    perform_license_check(user_data, app.clone()).await
}
