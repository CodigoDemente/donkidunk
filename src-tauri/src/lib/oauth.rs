use base64::{Engine, prelude::BASE64_URL_SAFE_NO_PAD};
use log::error;
use rand::{Rng, RngExt};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri_plugin_http::reqwest;
use tauri_plugin_http::reqwest::StatusCode;

use crate::{HTTP_CLIENT, errors::AuthError};

#[cfg(debug_assertions)]
const OAUTH_DOMAIN: &str = "http://localhost:5000";

#[cfg(not(debug_assertions))]
const OAUTH_DOMAIN: &str = "https://donkidunk.com";

const PKCE_CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

pub const CLIENT_ID: &str = "donkidunk-desktop";
pub const REDIRECT_URI: &str = "donkidunk://authorize";

#[derive(Serialize)]
pub struct ExchangeTokenPayload {
    pub grant_type: String,
    pub code: String,
    pub redirect_uri: String,
    pub client_id: String,
    pub code_verifier: String,
}

#[derive(Deserialize, Clone)]
pub struct ExchangeTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub refresh_token: String,
}

pub struct PKCEParams {
    pub state: String,
    pub code_challenge: String,
    pub code_verifier: String,
}

#[derive(Serialize)]
pub struct RefreshTokenPayload {
    grant_type: String,
    pub refresh_token: String,
}

pub fn build_authorize_url(code_challenge: &str, state: &str) -> String {
    format!(
        "{OAUTH_DOMAIN}/authorize?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&code_challenge_method=S256&code_challenge={code_challenge}&state={state}"
    )
}

pub fn build_exchange_url() -> String {
    format!("{OAUTH_DOMAIN}/auth/token")
}

pub fn map_oauth_error(error: reqwest::Error) -> AuthError {
    error!("Error while trying to exchange token: {error}");

    if error.is_body() || error.is_decode() {
        AuthError::BodyError
    } else if error.is_connect() || error.is_timeout() {
        AuthError::ConnectivityError
    } else {
        AuthError::UnexepectedAuthError
    }
}

pub fn generate_pkce_params() -> PKCEParams {
    let mut state_bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut state_bytes);

    let oauth_state: String = BASE64_URL_SAFE_NO_PAD.encode(state_bytes);

    let oauth_code_verifier: String = (0..128)
        .map(|_| {
            let idx = rand::rng().random_range(0..PKCE_CHARSET.len());

            PKCE_CHARSET[idx] as char
        })
        .collect();

    let oauth_code_challenge: String =
        BASE64_URL_SAFE_NO_PAD.encode(Sha256::digest(oauth_code_verifier.as_bytes()));

    PKCEParams {
        state: oauth_state,
        code_challenge: oauth_code_challenge,
        code_verifier: oauth_code_verifier,
    }
}

async fn perform_token_action<T>(payload: T) -> Result<ExchangeTokenResponse, AuthError>
where
    T: Serialize,
{
    let response = HTTP_CLIENT
        .post(build_exchange_url())
        .form(&payload)
        .send()
        .await
        .map_err(map_oauth_error)?;

    let status = response.status();

    if status.is_client_error() || status.is_server_error() {
        let text = response.text().await.map_err(map_oauth_error)?;

        error!("Error from OAuth server: {status} {text}");

        return Err(match status {
            StatusCode::BAD_REQUEST => AuthError::InvalidRequest,
            StatusCode::UNAUTHORIZED => AuthError::InvalidCredentials,
            _ => AuthError::UnexepectedAuthError,
        });
    }

    let json_body = response
        .json::<ExchangeTokenResponse>()
        .await
        .map_err(map_oauth_error)?;

    if json_body.token_type.to_lowercase() != "bearer" {
        error!(
            "Unrecognized token type from auth server reseponse: {}",
            json_body.token_type
        );
        return Err(AuthError::BodyError);
    }

    Ok(json_body)
}

pub async fn exchange_token(
    payload: ExchangeTokenPayload,
) -> Result<ExchangeTokenResponse, AuthError> {
    perform_token_action(payload).await
}

pub async fn refresh_token(refresh_token: String) -> Result<ExchangeTokenResponse, AuthError> {
    let payload = RefreshTokenPayload {
        grant_type: "refresh_token".to_string(),
        refresh_token,
    };

    perform_token_action(payload).await
}
