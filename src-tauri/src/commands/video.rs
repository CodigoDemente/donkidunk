use std::{
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn cut_video<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    video_path: String,
    ranges: Vec<(u32, u32)>,
) -> Result<String, String> {
    let ffmpeg = app.shell().sidecar("donkidunk_ffmpeg");

    if ffmpeg.is_err() {
        return Err(format!("[ffmpeg-sidecar] Error: {}", ffmpeg.unwrap_err()));
    }

    let start = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();

    println!("ranges: {ranges:?}");

    let mut all_parts: Vec<String> = Vec::new();

    for range in ranges {
        all_parts.push(format!("between(t,{},{})", range.0 / 1000, range.1 / 1000));
    }

    let select_command = all_parts.join("+");

    println!("select_command: {select_command}");
    println!("Video path: {video_path}");

    let output_path = format!(
        "{}_cut{}",
        video_path
            .trim_end_matches(".mp4")
            .trim_end_matches(".webm")
            .trim_end_matches(".wav"),
        &video_path[video_path.rfind('.').unwrap()..]
    );

    let status = Command::from(ffmpeg.unwrap())
        .arg("-i")
        .arg(video_path)
        .arg("-vf")
        .arg(format!("select='{select_command}', setpts=N/FRAME_RATE/TB",))
        .arg("-af")
        .arg(format!("aselect='{select_command}', asetpts=N/SR/TB"))
        .arg(&output_path)
        .status()
        .map_err(|e| e.to_string())?;

    let end = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();

    println!(
        "Time elapsed in seconds: {:?}",
        end.as_secs() - start.as_secs()
    );

    if status.success() {
        Ok(output_path)
    } else {
        Err("Failed to cut video".into())
    }
}
