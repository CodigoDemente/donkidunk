use std::sync::LazyLock;

use tauri_plugin_http::reqwest::Client;

pub mod auth;
pub mod commands;
pub mod configmanager;
pub mod deeplinks;
pub mod errors;
pub mod ffmpeg;
pub mod license;
pub mod menu;
pub mod metrics;
pub mod oauth;
pub mod scheduler;
pub mod securestore;
#[cfg(not(target_os = "windows"))]
pub mod server;
pub mod state;
pub mod tasks;
pub mod timelinerepository;

pub(crate) static HTTP_CLIENT: LazyLock<Client> = LazyLock::new(Client::new);

#[cfg(debug_assertions)]
pub(crate) const API_URL: &str = "http://localhost:5000";

#[cfg(not(debug_assertions))]
pub(crate) const API_URL: &str = "https://api.donkidunk.com";
