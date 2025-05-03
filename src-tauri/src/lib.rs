use std::env;

use which::which;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    ffmpeg_next::init().unwrap();

    let version = ffmpeg_next::util::version();

    format!(
        "Hello, {}! You've been greeted from Rust using FFMPEG version {}.{}.{} from {}",
        name,
        (version >> 16) & 0xFF,
        (version >> 8) & 0xFF,
        version & 0xFF,
        env::var("FFMPEG_PATH").unwrap()
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ffmpeg_path = which("ffmpeg");

    if ffmpeg_path.is_err() {
        println!("FFMPEG not found in PATH");
    }

    env::set_var("FFMPEG_PATH", ffmpeg_path.unwrap().to_str().unwrap());

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
