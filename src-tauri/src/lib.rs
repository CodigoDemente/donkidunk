use std::env;
use std::process::Command;
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


#[tauri::command]
fn cut_video() -> Result<String, String> {
    const input_path: &str = "/home/ecantegrit/Escritorio/videoToCut.webm";
    const start_time: &str = "00:00:04";
    const duration: &str = "00:00:08";
    let output_path = format!(
        "{}_CUTTED{}", 
        input_path
        .trim_end_matches(".mp4")
        .trim_end_matches(".webm")
        .trim_end_matches(".wav"), 
        &input_path[input_path.rfind('.').unwrap()..]
    );

    let ffmpeg_path = env::var("FFMPEG_PATH").map_err(|e| e.to_string())?;

    //TODO: copy doesnt seem to work well, with reenconding does work
    let status = Command::new(ffmpeg_path)
        .arg("-ss")
        .arg(start_time)
        .arg("-i")
        .arg(input_path)
        .arg("-t")
        .arg(duration)
        .arg("-c")
        .arg("copy") 
        .arg(&output_path)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(output_path)
    } else {
        Err("Failed to cut video".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ffmpeg_path = which("ffmpeg");

    if ffmpeg_path.is_err() {
        println!("FFMPEG not found in PATH");
    }

    env::set_var("FFMPEG_PATH", ffmpeg_path.unwrap().to_str().unwrap());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, cut_video])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
