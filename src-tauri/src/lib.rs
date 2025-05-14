use std::env;

use menu::MenuExtensions;
use which::which;

mod menu;
mod server;

#[tauri::command]
async fn set_menu_item_enabling_status(
    app: tauri::AppHandle,
    menu_id: &str,
    enabled: bool,
) -> Result<(), String> {
    let menu = app.menu();

    if let Some(menu) = menu {
        let menu_id = tauri::menu::MenuId::new(menu_id);
        menu.set_enabled_by_item_id(&menu_id, enabled)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tokio::main]
pub async fn run() {
    let ffmpeg_path = which("ffmpeg");

    if ffmpeg_path.is_err() {
        println!("FFMPEG not found in PATH");
    }

    env::set_var("FFMPEG_PATH", ffmpeg_path.unwrap().to_str().unwrap());

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            #[cfg(target_os = "linux")]
            server::get_linux_file_url,
            set_menu_item_enabling_status,
        ])
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            #[cfg(target_os = "linux")]
            tokio::spawn(server::setup_webserver());

            menu::setup_menu(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
