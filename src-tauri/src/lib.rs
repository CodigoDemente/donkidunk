use std::env;

use which::which;

mod menu;
mod server;

#[tauri::command]
async fn set_save_menu_enabling_status(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
  let Some(menu) = app.menu() else{
    log::debug!("Menu not found");

    return Ok(())
  };
  
  let Some(file_submenu) = menu.get("file-menu") else {
    log::debug!("File menu not found");

    return Ok(())
  };

  let Some(save_submenu) = file_submenu.as_submenu().expect("Not a submenu").get("save-menu") else {
    log::debug!("Save project submenu not found");

    return Ok(())
  };

  let Some(save_project) = save_submenu.as_submenu().expect("Not a submenu").get("save_project") else {
    log::debug!("Save project menu item not found");

    return Ok(())
  };

  let save_project_menuitem = save_project.as_menuitem().expect("Not a menu item");

  save_project_menuitem.set_enabled(enabled).expect("Failed to set menu item enabled");

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

    // On linux it's mutable because we need to add the webserver handler
    #[cfg(target_os = "linux")]
    let mut tauri_app;

    #[cfg(not(target_os = "linux"))]
    let tauri_app;

    tauri_app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            set_save_menu_enabling_status,
        ])
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build());

    #[cfg(target_os = "linux")]
    {
        tauri_app = tauri_app.invoke_handler(tauri::generate_handler![server::get_linux_file_url]);
    }

    tauri_app
        .setup(|app| {
            #[cfg(target_os = "linux")]
            tokio::spawn(server::setup_webserver());

            menu::setup_menu(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
