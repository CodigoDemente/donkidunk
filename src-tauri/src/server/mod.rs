#[cfg(target_os = "linux")]
use {
    axum::{
        extract::{Query, Request},
        response::IntoResponse,
        routing::get,
        Router,
    },
    std::{collections::HashMap, convert::Infallible, env},
    tokio::net::TcpListener,
    tower::ServiceExt,
    tower_http::services::ServeFile,
};

#[cfg(target_os = "linux")]
#[tauri::command]
pub fn get_linux_file_url(file_path: &str) -> String {
    let port = match env::var("WEBSERVER_PORT") {
        Ok(port) => port,
        Err(_) => "16780".to_string(),
    };

    format!("http://localhost:{}/?file={}", port, file_path)
}

#[cfg(target_os = "linux")]
pub async fn setup_webserver() {
    let port = match env::var("WEBSERVER_PORT") {
        Ok(port) => port,
        Err(_) => "16780".to_string(),
    };

    let app = Router::new().route("/", get(download_file));

    let listner = TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .unwrap();

    axum::serve(listner, app).await.unwrap();
}

#[cfg(target_os = "linux")]
pub async fn download_file(
    Query(params): Query<HashMap<String, String>>,
    req: Request<axum::body::Body>,
) -> Result<impl IntoResponse, Infallible> {
    let file_path = params.get("file").map_or("", String::as_str);

    log::debug!("File path: {}", file_path);

    ServeFile::new(file_path).oneshot(req).await
}
