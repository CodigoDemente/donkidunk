use chrono::{DateTime, Duration, Utc};
use log::{error, info, warn};
use tauri::{AppHandle, Manager, Runtime};

use crate::{
    auth::{GRACE_PERIOD_HOURS, UserData, decode_token, logout, refresh_access_token},
    errors::{AuthError, LicenseError},
    license::{get_user_license, store_license},
    state::AppState,
};

const AUTH_TASK_INTERVAL: u64 = 3600;
const LICENSE_INTERVAL: i64 = 7200;
pub const AUTH_TASK_NAME: &str = "AUTH_TASK";

pub async fn schedule_auth_task<R: Runtime>(app_handle: AppHandle<R>) {
    let state = app_handle.state::<AppState>();

    let interval = {
        let auth_guard = state.authentication.lock().await;

        if !auth_guard.is_authenticated {
            return;
        }

        std::time::Duration::from_secs(AUTH_TASK_INTERVAL)
    };

    let login_interval = {
        let auth_guard = state.authentication.lock().await;

        let duration = auth_guard.expires_in as f64 * 0.75; // 75% of the token duration

        Duration::seconds(duration.ceil() as i64)
    };

    let license_interval = Duration::seconds(LICENSE_INTERVAL);

    let mut scheduler_guard = state.scheduler.lock().await;

    let owned_app_handle = app_handle.clone();

    scheduler_guard.schedule_task(
        AUTH_TASK_NAME.to_string(),
        move || {
            let handle = owned_app_handle.clone();
            async move {
                let app_state = handle.state::<AppState>();

                let (last_login_check, last_license_check) = {
                    let task_guard = app_state.tasks.lock().await;

                    (task_guard.last_license_check, task_guard.last_login_check)
                };

                let user_data = if Utc::now().naive_utc() - last_login_check > login_interval {
                    match perform_auth(handle.clone()).await {
                        Ok(user_data) => Some(user_data),
                        Err(err) => {
                            warn!("Error in login recurring task: {err}");

                            None
                        }
                    }
                } else {
                    None
                };

                if let Some(user_data) = user_data
                    && Utc::now().naive_utc() - last_license_check > license_interval
                    && let Err(err) = perform_license_check(user_data, handle).await
                {
                    warn!("Error in license recurring task: {err}");
                }
            }
        },
        interval,
    );
}

async fn perform_auth<R: Runtime>(app: AppHandle<R>) -> Result<UserData, AuthError> {
    let app_state = app.state::<AppState>();

    let (current_access_token, current_refresh_token, should_refresh) = {
        let authentication_guard = app_state.authentication.lock().await;

        let should_refresh = authentication_guard.is_authenticated
            && authentication_guard.expires_at - Duration::seconds(60) <= Utc::now();

        (
            authentication_guard.access_token.clone(),
            authentication_guard.refresh_token.clone(),
            should_refresh,
        )
    };

    let user_data = match decode_token(&app_state.jwt_key, &current_access_token) {
        Ok(claims) => UserData {
            user_email: claims.email,
            user_id: claims.sub,
            user_name: claims.name,
            access_token: current_access_token,
            last_verified_time: DateTime::from_timestamp_secs(claims.iat)
                .unwrap_or(Utc::now() - Duration::weeks(1)),
        },
        Err(..) => {
            warn!("Could not decode stored token, falling back to license data");

            let license = app_state.license.lock().await;

            if let Some(license) = license.as_ref() {
                UserData {
                    user_id: license.user_id.clone(),
                    user_email: license.user_email.clone(),
                    user_name: license.user_name.clone(),
                    access_token: current_access_token,
                    last_verified_time: license.last_validation,
                }
            } else {
                logout(&app).await?;

                return Err(AuthError::CredentialNotFound(
                    "Error decoding token and no license data found".to_string(),
                ));
            }
        }
    };

    if !should_refresh {
        return Ok(user_data);
    }

    match refresh_access_token(&app, &current_refresh_token).await {
        Ok(response) => Ok(UserData {
            user_id: response.claims.sub,
            user_email: response.claims.email,
            user_name: response.claims.name,
            access_token: response.access_token,
            last_verified_time: user_data.last_verified_time, // Use last verified time, if we use the new one, the license check would always believe that the license is being checked correctly all times but last one
        }),
        Err(error) => match error {
            AuthError::UnexepectedAuthError
            | AuthError::BodyError
            | AuthError::ConnectivityError => Err(error),
            AuthError::InvalidCredentials | AuthError::InvalidRequest => {
                logout(&app).await?;
                Err(error)
            }
            _ => {
                if should_force_login(user_data.last_verified_time) {
                    logout(&app).await?
                }

                Err(error)
            }
        },
    }
}

fn should_force_login(last_verified_time: DateTime<Utc>) -> bool {
    let user_time = Utc::now();

    // Assume 1 minute drift just in case the user has manual time set
    if user_time + Duration::seconds(60) < last_verified_time {
        error!(
            "User clock has too much drift. Server time {last_verified_time}. User clock {user_time}"
        );
        return true;
    }

    let last_check_difference = user_time - last_verified_time;

    if last_check_difference.num_hours() > GRACE_PERIOD_HOURS {
        info!(
            "Last check was more than {GRACE_PERIOD_HOURS} hours ago: Last check: {} hours ago",
            last_check_difference.num_hours()
        );

        return true;
    }

    false
}

async fn perform_license_check<R: Runtime>(
    user_data: UserData,
    app: AppHandle<R>,
) -> Result<(), AuthError> {
    let app_state = app.state::<AppState>();

    let subscription_data =
        match get_user_license(user_data.user_id.clone(), &user_data.access_token).await {
            Ok(data) => data,
            Err(err) => match err {
                LicenseError::Unexepected
                | LicenseError::BodyError
                | LicenseError::ConnectivityError => return Err(err.into()),
                _ => {
                    if should_force_login(user_data.last_verified_time) {
                        logout(&app).await?
                    }

                    return Err(err.into());
                }
            },
        };

    {
        let license_guard = app_state.license.lock().await;

        store_license(user_data, subscription_data, license_guard);
    }

    Ok(())
}
