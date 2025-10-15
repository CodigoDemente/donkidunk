// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod menu;

#[cfg(target_os = "linux")]
mod server;

use commands::menu::*;
use commands::video::*;
#[cfg(debug_assertions)]
use tauri::Manager;

fn create_app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::App<R> {
    builder
        .invoke_handler(tauri::generate_handler![
            #[cfg(target_os = "linux")]
            server::get_linux_file_url,
            set_menu_item_enabling_status,
            cut_video,
        ])
        .setup(|app| {
            #[cfg(target_os = "linux")]
            tokio::spawn(server::setup_webserver());

            menu::setup_menu(app)?;

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
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build());

    let app = create_app(builder);

    app.run(|_, event| {
        log::debug!("Tauri event: {event:?}");

        if let tauri::RunEvent::Ready = event {
            log::debug!("Tauri is ready");
        }
    });
}

#[cfg(test)]
mod tests {
    use std::process::Command;

    use super::*;
    use tauri::{path, Manager};
    use tauri_plugin_shell::ShellExt;

    #[ignore]
    #[tokio::test]
    async fn it_should_run_ffmpeg_command() -> Result<(), String> {
        let builder = tauri::test::mock_builder().plugin(tauri_plugin_shell::init());
        let app = create_app(builder);

        let path = path::PathResolver::app_data_dir(app.path()).unwrap();

        println!("App data path: {path:?}");

        let ffmpeg = app.shell().sidecar("donkidunk_ffmpeg").unwrap();

        let status = Command::from(ffmpeg)
            .arg("-version")
            .status()
            .map_err(|e| e.to_string())?;

        assert!(status.success());

        Ok(())
    }
}
