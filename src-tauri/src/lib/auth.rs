use chrono::{DateTime, Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, Runtime, Url};

use log::error;
use tokio::sync::MutexGuard;

use crate::{
    errors::{AppError, AuthError},
    license::{get_user_license, store_license},
    oauth::{
        CLIENT_ID, ExchangeTokenPayload, ExchangeTokenResponse, REDIRECT_URI, exchange_token,
        refresh_token,
    },
    securestore::SecureStore,
    state::{AppState, Authentication},
    tasks::schedule_auth_task,
};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LoginStateEvent {
    is_authenticated: bool,
}

#[derive(Serialize, Deserialize)]
pub struct StoredCredentials {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64, //Millis
    pub expires_in: i64, //Seconds
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub iss: String,
    pub sub: String,
    pub exp: i64,
    pub iat: i64,
    pub name: String,
    pub email: String,
}

pub struct UserData {
    pub user_id: String,
    pub user_email: String,
    pub user_name: String,
    pub access_token: String,
    pub last_verified_time: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenResponse {
    pub claims: Claims,
    pub access_token: String,
}

pub const GRACE_PERIOD_HOURS: i64 = 72;

pub async fn handle_return_url<R: Runtime>(app: AppHandle<R>, url: Url) -> Result<(), AppError> {
    let app_state = app.state::<AppState>();

    let mut code = String::default();
    let mut state = String::default();

    url.query_pairs().for_each(|q| {
        if q.0 == "state" {
            state = q.1.to_string();
        } else if q.0 == "code" {
            code = q.1.to_string();
        }
    });

    if code.is_empty() || state.is_empty() {
        let error_text = if code.is_empty() { "Code" } else { "State" };
        return Err(AuthError::DeeplinkMalformed(format!("{error_text} not present")).into());
    }

    let payload = {
        let auth_data = app_state.authentication.lock().await;

        if state != auth_data.oauth.state {
            error!("Stored and received state does not match");

            return Err(AuthError::UnexepectedAuthError.into());
        }

        ExchangeTokenPayload {
            client_id: CLIENT_ID.to_string(),
            grant_type: "authorization_code".to_string(),
            code,
            code_verifier: auth_data.oauth.code_verifier.clone(),
            redirect_uri: REDIRECT_URI.to_string(),
        }
    };

    let exchanged_tokens = exchange_token(payload).await?;

    let token_claims = decode_token(&app_state.jwt_key, &exchanged_tokens.access_token)?;

    let subscription_data =
        get_user_license(token_claims.sub.clone(), &exchanged_tokens.access_token)
            .await
            .map_err(AuthError::from)?;

    {
        let auth_guard = app_state.authentication.lock().await;
        let store_guard = app_state.secure_store.lock().await;
        store_credentials(exchanged_tokens.clone(), auth_guard, store_guard)?;
    }

    let user_data = UserData {
        access_token: exchanged_tokens.access_token,
        user_id: token_claims.sub,
        user_email: token_claims.email,
        user_name: token_claims.name,
        last_verified_time: DateTime::from_timestamp_secs(token_claims.iat)
            .unwrap_or(Utc::now() - Duration::weeks(1)),
    };

    {
        let license_guard = app_state.license.lock().await;

        store_license(user_data, subscription_data, license_guard);
    }

    app_state.reset_oauth_flow().await;
    schedule_auth_task(app.clone()).await;

    app.emit(
        "auth:user-logged-in",
        LoginStateEvent {
            is_authenticated: true,
        },
    )?;

    Ok(())
}

pub fn retrieve_credentials(secure_store: &SecureStore) -> Option<StoredCredentials> {
    let Ok(stored_credentials) = secure_store.get_entry() else {
        return None;
    };

    let credentials = match serde_json::from_str::<StoredCredentials>(&stored_credentials) {
        Ok(credentials) => credentials,
        Err(e) => {
            error!("Error parsing credentials from store: {e}");
            return None;
        }
    };

    Some(credentials)
}

pub async fn refresh_access_token<R: Runtime>(
    app: &AppHandle<R>,
    current_refresh_token: &str,
) -> Result<RefreshTokenResponse, AuthError> {
    let app_state = app.state::<AppState>();

    let new_tokens_result = refresh_token(current_refresh_token.to_string()).await?;

    let claims = {
        let auth_guard = app_state.authentication.lock().await;
        let store_guard = app_state.secure_store.lock().await;
        store_credentials(new_tokens_result.clone(), auth_guard, store_guard)?;

        decode_token(&app_state.jwt_key, &new_tokens_result.access_token)?
    };

    Ok(RefreshTokenResponse {
        claims,
        access_token: new_tokens_result.access_token,
    })
}

fn store_credentials(
    tokens: ExchangeTokenResponse,
    mut authentication_guard: MutexGuard<'_, Authentication>,
    secure_store: MutexGuard<'_, SecureStore>,
) -> Result<(), AuthError> {
    authentication_guard.is_authenticated = true;
    authentication_guard.access_token = tokens.access_token;
    authentication_guard.refresh_token = tokens.refresh_token;
    authentication_guard.expires_in = tokens.expires_in;
    authentication_guard.expires_at = Utc::now() + Duration::seconds(tokens.expires_in);

    let credentials = serde_json::to_string(&StoredCredentials {
        access_token: authentication_guard.access_token.clone(),
        refresh_token: authentication_guard.refresh_token.clone(),
        expires_at: authentication_guard.expires_at.timestamp_millis(),
        expires_in: authentication_guard.expires_in,
    })
    .map_err(|e| {
        error!("Error serializing credentials: {e}");

        AuthError::UnexepectedAuthError
    })?;

    secure_store.create_entry(credentials)
}

pub fn decode_token(decoding_key: &DecodingKey, jwt: &str) -> Result<Claims, AuthError> {
    let mut validation = Validation::new(Algorithm::RS256);

    validation.set_required_spec_claims(&["iss"]);
    validation.set_issuer(&["donkidunk_api"]);
    validation.validate_exp = false;

    let token_data = match decode::<Claims>(jwt, decoding_key, &validation) {
        Ok(c) => c,
        Err(err) => {
            error!("Error decoding token: {err}");

            return Err(AuthError::TokenDecodeError);
        }
    };

    Ok(token_data.claims)
}

pub async fn logout<R: Runtime>(app: &AppHandle<R>) -> Result<(), AuthError> {
    app.state::<AppState>().logout().await?;

    app.emit(
        "auth:user-logged-out",
        LoginStateEvent {
            is_authenticated: false,
        },
    )
    .map_err(|e| {
        error!("Error emitting logged out event: {e}");
        AuthError::UnexepectedAuthError
    })?;

    Ok(())
}
