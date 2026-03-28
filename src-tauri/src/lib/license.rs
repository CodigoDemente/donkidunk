use std::{fmt::Display, str::FromStr};

use axum::http::StatusCode;
use chrono::{DateTime, NaiveDateTime};
use log::error;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Runtime};
use tauri_plugin_http::reqwest;
use tokio::sync::MutexGuard;
use uuid::Uuid;

use crate::{
    API_URL, HTTP_CLIENT,
    auth::UserData,
    errors::LicenseError,
    state::{AppState, License},
};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LicenseStateEvent {
    subscription_id: String,
    status: String,
    features: Vec<String>,
}

#[derive(Deserialize, Clone)]
pub struct LicenseResponse {
    pub subscription_id: String,
    pub subscription_status: String,
    pub next_billing_date: String,
    pub features: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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

pub struct Subscription {
    pub subscription_id: Uuid,
    pub subscription_status: SubscriptionStatus,
    pub next_billing_date: NaiveDateTime,
    pub features: Vec<String>,
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

        return Err(match status {
            StatusCode::BAD_REQUEST => LicenseError::InvalidRequest,
            StatusCode::UNAUTHORIZED => LicenseError::InvalidCredentials,
            _ => LicenseError::Unexepected,
        });
    }

    let json_body = response
        .json::<LicenseResponse>()
        .await
        .map_err(map_license_err)?;

    let subscription_id = match Uuid::from_str(&json_body.subscription_id) {
        Ok(id) => id,
        Err(e) => {
            error!("Error parsing subscription_id: {e}");

            return Err(LicenseError::BodyError);
        }
    };

    let next_billing_date = match DateTime::parse_from_rfc3339(&json_body.next_billing_date) {
        Ok(date) => date.naive_utc(),
        Err(e) => {
            error!("Error parsing next billing date: {e}");

            return Err(LicenseError::BodyError);
        }
    };

    let subscription_status = SubscriptionStatus::from(json_body.subscription_status);

    Ok(Subscription {
        subscription_id,
        subscription_status,
        next_billing_date,
        features: json_body.features,
    })
}

pub fn store_license(
    user_data: UserData,
    subscription: Subscription,
    mut license_guard: MutexGuard<'_, Option<License>>,
) {
    *license_guard = Some(License {
        last_validation: user_data.last_verified_time,
        user_id: user_data.user_id,
        user_email: user_data.user_email,
        user_name: user_data.user_name,
        subscription_id: Some(subscription.subscription_id.to_string()),
        status: Some(subscription.subscription_status),
        expires_at: Some(subscription.next_billing_date),
        features: Some(subscription.features),
    })
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
            features: subscription.features,
        },
    )
    .map_err(|e| {
        error!("Error emitting license expired events: {e}");
        LicenseError::Unexepected
    })?;

    Ok(())
}
