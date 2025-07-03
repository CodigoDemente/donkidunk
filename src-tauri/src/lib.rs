use menu::MenuExtensions;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri_plugin_shell::ShellExt;

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

#[tauri::command]
async fn cut_video(
    app: tauri::AppHandle,
    video_path: String,
    ranges: Vec<(u32, u32)>,
) -> Result<String, String> {
    let ffmpeg = app.shell().sidecar("donkidunk_ffmpeg");

    if ffmpeg.is_err() {
        return Err(format!("[ffmpeg-sidecar] Error: {}", ffmpeg.unwrap_err()));
    }

    let start = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();

    println!("ranges: {:?}", ranges);

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
        .arg(format!(
            "select='{}', setpts=N/FRAME_RATE/TB",
            select_command
        ))
        .arg("-af")
        .arg(format!("aselect='{}', asetpts=N/SR/TB", select_command))
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tokio::main]
pub async fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            #[cfg(target_os = "linux")]
            server::get_linux_file_url,
            set_menu_item_enabling_status,
            cut_video,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ffmpeg_command() -> Result<(), String> {
        let app = tauri::Builder::default()
            .plugin(tauri_plugin_shell::init())
            .build(tauri::generate_context!())
            .expect("error while running tauri application");

        let ffmpeg = app.shell().sidecar("donkidunk_ffmpeg");

        assert!(
            ffmpeg.is_ok(),
            "Failed to get ffmpeg sidecar: {}",
            ffmpeg.unwrap_err()
        );

        let status = Command::from(ffmpeg.unwrap())
            .arg("-version")
            .status()
            .map_err(|e| e.to_string())?;

        assert!(status.success());

        Ok(())
    }
}
