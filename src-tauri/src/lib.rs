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

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![server::get_linux_file_url])
        .setup(|_| {
            #[cfg(target_os = "linux")]
            tokio::spawn(server::setup_webserver());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
