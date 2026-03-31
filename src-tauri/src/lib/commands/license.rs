use serde::Serialize;

use crate::{
    errors::{AppError, AuthError, LicenseError},
    license::{SubscriptionEntitlement, SubscriptionStatus},
    state::AppState,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct License {
    id: String,
    status: SubscriptionStatus,
    expires_at: i64,
    features: Vec<SubscriptionEntitlement>,
}

#[tauri::command]
pub async fn get_license(state: tauri::State<'_, AppState>) -> Result<License, AppError> {
    let license_guard = state.license.lock().await;
    let err = Err(Into::<AuthError>::into(LicenseError::NoLicenseData).into());

    let Some(license) = license_guard.as_ref() else {
        return err;
    };

    let Some(id) = license.subscription_id.as_ref() else {
        return err;
    };

    let Some(status) = license.status else {
        return err;
    };

    let Some(expires_at) = license.expires_at else {
        return err;
    };

    let Some(features) = license.features.as_ref() else {
        return err;
    };

    Ok(License {
        id: id.clone(),
        status,
        expires_at: expires_at.timestamp_millis(),
        features: features.clone(),
    })
}
