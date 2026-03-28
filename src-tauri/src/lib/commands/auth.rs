use crate::errors::AppError;
use crate::oauth::build_authorize_url;
use crate::oauth::generate_pkce_params;
use crate::state::AppState;

#[tauri::command]
pub async fn start_oauth_flow(state: tauri::State<'_, AppState>) -> Result<String, AppError> {
    let params = generate_pkce_params();

    let mut auth_guard = state.authentication.lock().await;

    auth_guard.oauth.code_challenge = params.code_challenge;
    auth_guard.oauth.code_verifier = params.code_verifier;
    auth_guard.oauth.state = params.state;

    Ok(build_authorize_url(
        &auth_guard.oauth.code_challenge,
        &auth_guard.oauth.state,
    ))
}

#[tauri::command]
pub async fn is_authenticated(state: tauri::State<'_, AppState>) -> Result<bool, AppError> {
    let auth_guard = state.authentication.lock().await;

    Ok(auth_guard.is_authenticated)
}

#[tauri::command]
pub async fn logout(state: tauri::State<'_, AppState>) -> Result<(), AppError> {
    state.logout().await?;

    Ok(())
}
