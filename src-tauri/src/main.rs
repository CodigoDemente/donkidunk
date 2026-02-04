// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod menu;

#[cfg(not(target_os = "windows"))]
mod server;

use commands::config::*;
use commands::database::*;
use commands::license::*;
use commands::menu::*;
use commands::metrics::*;
use commands::video::*;
use lib::license;
use lib::state::{AppState, AppStateTrait};
use tauri::Manager;

fn create_app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::App<R> {
    builder
        .invoke_handler(tauri::generate_handler![
            #[cfg(not(target_os = "windows"))]
            server::get_linux_file_url,
            set_menu_item_enabling_status,
            cut_video,
            get_user_config,
            get_button_boards,
            save_button_board,
            save_board_size,
            save_ui_mode,
            set_database_conn,
            disconnect_database,
            export_clips_csv,
            get_is_expired,
        ])
        .setup(move |app| {
            #[cfg(not(target_os = "windows"))]
            tokio::spawn(server::setup_webserver());

            menu::setup_menu(app)?;

            let is_expired = license::is_installation_expired(
                &app.config().identifier,
                &app.package_info().name,
            )
            .unwrap_or_else(|err| {
                log::error!("Failed to check expired installation: {err}");
                true
            });

            app.manage(AppState::new(app, is_expired));

            #[cfg(debug_assertions)]
            app.get_webview_window("main").unwrap().open_devtools();

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
}

#[tokio::main]
async fn main() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Debug)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build());

    let app = create_app(builder);

    app.run(|_, event| {
        if !matches!(event, tauri::RunEvent::MainEventsCleared) {
            log::debug!("Tauri event: {event:?}");
        }

        if let tauri::RunEvent::Ready = event {
            log::debug!("Tauri is ready");
        }
    });
}

#[cfg(test)]
mod tests {
    use std::process::Command;

    use super::*;
    use tauri_plugin_shell::ShellExt;

    #[tokio::test]
    #[ignore]
    async fn it_should_run_ffmpeg_command() -> Result<(), String> {
        let builder = tauri::test::mock_builder().plugin(tauri_plugin_shell::init());
        let app = create_app(builder);

        let ffmpeg = app.shell().sidecar("donkidunk_ffmpeg").unwrap();

        let status = Command::from(ffmpeg)
            .arg("-version")
            .status()
            .map_err(|e| e.to_string())?;

        assert!(status.success());

        Ok(())
    }
}
