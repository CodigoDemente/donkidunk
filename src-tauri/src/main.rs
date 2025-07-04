// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod menu;

use commands::menu::*;
use commands::video::*;


fn create_app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::App<R> {
    let app = builder
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

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    return app;
}
    

#[tokio::main]
async fn main() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build());


    let app = create_app(builder);

    app.run(|app_handle, event| {
        log::debug!("Tauri event: {:?}", event);

        match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                log::debug!("Exit requested, exiting...");
                api.prevent_exit();
                app_handle.exit(0);
            },
            tauri::RunEvent::Ready => {
                log::debug!("Tauri is ready");
            },
            _ => {}
        }
    });
}


#[cfg(test)]
mod tests {
    use std::process::Command;
    
    use super::*;
    use tauri_plugin_shell::ShellExt;

    #[test]
    fn it_should_get_ffmpeg_sidecar() -> () {
        let builder = tauri::test::mock_builder().plugin(tauri_plugin_shell::init());
        let app = create_app(builder);

        let ffmpeg = app.shell().sidecar("donkidunk_ffmpeg");

        assert!(
            ffmpeg.is_ok(),
            "Failed to get ffmpeg sidecar: {}",
            ffmpeg.unwrap_err()
        );
    }

    #[tokio::test]
    async fn it_should_run_ffmpeg_command() -> Result<(), String> {
        let builder = tauri::test::mock_builder().plugin(tauri_plugin_shell::init());
        let app = create_app(builder);

        let ffmpeg = app.shell().sidecar("donkidunk_ffmpeg").unwrap();

        let status = Command::from(ffmpeg)
            .status()
            .map_err(|e| e.to_string())?;

        assert!(status.success());

        Ok(())
    }
}