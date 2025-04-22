use serde::{Deserialize, Serialize};
use std::fs::File;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use std::{collections::HashMap, env};
use which::which;

#[derive(Serialize, Deserialize, Debug)]
struct Clip {
    time_start: u32,
    time_end: u32,
    r#type: u8,
    attributes: HashMap<String, u8>,
}

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
    let data = File::open("D:\\Downloads\\cortes_sin_solapamiento.jsonc").unwrap();

    const INPUT_PATH: &str = "D:\\Downloads\\house_on_haunted_hill_512kb.mp4";

    let start = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();

    // Parse the string of data into serde_json::Value.
    let all_clips: Vec<Clip> = serde_json::from_reader(data).unwrap();

    println!("all_clips: {:?}", all_clips.len());

    let mut all_parts: Vec<String> = Vec::new();

    for clip in all_clips {
        all_parts.push(
            format!(
                "between(t,{},{})",
                clip.time_start/1000, clip.time_end/1000
            )
        );
    }
    
    let select_command = all_parts.join("+");

    println!("select_command: {}", select_command);
    println!("INPUT_PATH: {}", INPUT_PATH);
    println!("FFMPEG_PATH: {}", env::var("FFMPEG_PATH").unwrap());

    let output_path = format!(
        "{}_cut{}",
        INPUT_PATH
            .trim_end_matches(".mp4")
            .trim_end_matches(".webm")
            .trim_end_matches(".wav"),
        &INPUT_PATH[INPUT_PATH.rfind('.').unwrap()..]
    );

    let ffmpeg_path = env::var("FFMPEG_PATH").map_err(|e| e.to_string())?;

    //TODO: copy doesnt seem to work well, with reenconding does work
    let status = Command::new(ffmpeg_path)
        .arg("-i")
        .arg(INPUT_PATH)
        .arg("-vf")
        .arg(format!("select='{}', setpts=N/FRAME_RATE/TB", select_command))
        .arg("-af")
        .arg(format!("aselect='{}', asetpts=N/SR/TB", select_command))
        .arg(&output_path)
        .status()
        .map_err(|e| e.to_string())?;

    let end = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();

    println!("Time elapsed in seconds: {:?}", end.as_secs() - start.as_secs());

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
