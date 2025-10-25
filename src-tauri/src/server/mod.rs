// #[cfg(not(target_os = "windows"))]
use {
    axum::{extract::Query, routing::get, Router},
    axum_extra::{headers::Range, TypedHeader},
    axum_range::{KnownSize, Ranged},
    std::{collections::HashMap, env},
    tokio::{fs::File, net::TcpListener},
};

// #[cfg(not(target_os = "windows"))]
#[tauri::command]
pub fn get_linux_file_url(file_path: &str) -> String {
    let port = match env::var("WEBSERVER_PORT") {
        Ok(port) => port,
        Err(_) => "16780".to_string(),
    };

    format!("http://localhost:{port}/?file={file_path}")
}

// #[cfg(not(target_os = "windows"))]
pub async fn setup_webserver() {
    let port = match env::var("WEBSERVER_PORT") {
        Ok(port) => port,
        Err(_) => "16780".to_string(),
    };

    let app = Router::new().route("/", get(download_file));

    let listner = TcpListener::bind(format!("127.0.0.1:{port}"))
        .await
        .unwrap();

    axum::serve(listner, app).await.unwrap();
}

// #[cfg(not(target_os = "windows"))]
pub async fn download_file(
    range: Option<TypedHeader<Range>>,
    Query(params): Query<HashMap<String, String>>,
) -> Ranged<KnownSize<File>> {
    let file_path = params.get("file").map_or("", String::as_str);

    log::debug!("File path: {file_path}");

    let file = File::open(file_path).await.unwrap();

    let body = KnownSize::file(file).await.unwrap();

    let range = range.map(|TypedHeader(range)| range);

    Ranged::new(range, body)
}
