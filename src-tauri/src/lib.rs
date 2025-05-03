use std::env;

use which::which;

mod server;

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
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init());

    #[cfg(target_os = "linux")] {
        tauri_app = tauri_app.invoke_handler(tauri::generate_handler![server::get_linux_file_url]);
    }
    
    tauri_app.setup(|_| {
            #[cfg(target_os = "linux")]
            tokio::spawn(server::setup_webserver());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
