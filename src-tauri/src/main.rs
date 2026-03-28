// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dnkcore::commands::auth::*;
use dnkcore::commands::config::*;
use dnkcore::commands::database::*;
use dnkcore::commands::menu::*;
use dnkcore::commands::metrics::*;
use dnkcore::commands::video::*;

use dnkcore::deeplinks::process_deeplinks;
use dnkcore::menu::setup_menu;
#[cfg(not(target_os = "windows"))]
use dnkcore::server::{get_linux_file_url, setup_webserver};
use dnkcore::state::AppState;
use dnkcore::tasks::schedule_auth_task;
use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;

fn create_app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::App<R> {
    builder
        .invoke_handler(tauri::generate_handler![
            #[cfg(not(target_os = "windows"))]
            get_linux_file_url,
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
            start_oauth_flow,
            is_authenticated,
            logout,
        ])
        .setup(move |app| {
            #[cfg(not(target_os = "windows"))]
            tokio::spawn(setup_webserver());

            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }

            setup_menu(app)?;

            app.manage(AppState::new(app)?);

            #[cfg(debug_assertions)]
            app.get_webview_window("main").unwrap().open_devtools();

            let start_urls = app.deep_link().get_current()?;

            let app_handle = app.handle().clone();

            let start_app_handle = app_handle.clone();
            if let Some(urls) = start_urls {
                tokio::spawn(process_deeplinks(start_app_handle, urls));
            }

            let deeplink_app_handle = app_handle.clone();
            app.deep_link().on_open_url(move |event| {
                let handle = deeplink_app_handle.clone();

                tokio::spawn(process_deeplinks(handle, event.urls()));
            });

            tokio::spawn(schedule_auth_task(app_handle.clone()));

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
}

#[tokio::main]
async fn main() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_deep_link::init())
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
