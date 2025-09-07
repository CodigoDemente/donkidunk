use std::{
    ffi::OsString,
    future::Future,
    path::PathBuf,
    process::Stdio,
    sync::Arc,
    task,
    time::{SystemTime, UNIX_EPOCH},
};

use anyhow::anyhow;
use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

use tokio::{
    fs::File,
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    process::{ChildStderr, Command},
    sync::Mutex,
};
use uuid::Uuid;

use crate::errors::{AppError, FfmpegError};

fn parse_time_to_ffmpeg_format(time: &f32) -> String {
    let minutes_raw = *time as i32 / 60;
    let seconds = time % 60.0;
    let hours = minutes_raw / 60;
    let minutes = minutes_raw % 60;

    format!("{:02}:{:02}:{:05.4}", hours, minutes, seconds)
}

fn parse_ffmpeg_format_to_time(time: &str) -> f32 {
    let parts: Vec<&str> = time.split(':').collect();

    if parts.len() != 3 {
        return 0.0;
    }

    let hours: f32 = parts[0].parse().unwrap_or(0.0);
    let minutes: f32 = parts[1].parse().unwrap_or(0.0);
    let seconds: f32 = parts[2].parse().unwrap_or(0.0);

    hours * 3600.0 + minutes * 60.0 + seconds
}

async fn process_progress(
    buffer: BufReader<ChildStderr>,
    total_duration: f32,
    progress_channel: Arc<Channel<ExportEvent>>,
) -> Result<(), FfmpegError> {
    let mut lines = buffer.lines();

    let re = regex::Regex::new(r"time=(?<time>\d{2}:\d{2}:\d{2}(\.\d{2,4})?)").unwrap();

    let _ = tokio::spawn(async move {
        while let Some(line) = lines.next_line().await? {
            for capture in re.captures_iter(&line) {
                let time = capture.name("time").unwrap().as_str();

                let seconds = parse_ffmpeg_format_to_time(time);

                let percentage = seconds / total_duration;

                let progress = (percentage + 1.0) / 2.0;

                log::debug!("Progress {}%", progress);
                // Adds 100% to the numerator and divide by 2 since this is the second half of the process and has to start at 50%

                let _ = progress_channel.send(ExportEvent { progress: progress });
            }
        }

        Ok::<(), FfmpegError>(())
    })
    .await
    .map_err(|e| FfmpegError::from(e))?;

    Ok(())
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event")]
pub struct ExportEvent {
    progress: f32,
}

#[derive(Debug)]
struct ProgressTracker {
    total_clips_extracted: f32,
    total_clips_to_extract: f32,
    final_clip_total_duration: f32,
    merge_progress: f32,
}

pub struct Ffmpeg<R: tauri::Runtime> {
    app: AppHandle<R>,
    on_progress_channel: Arc<Channel<ExportEvent>>,
    ffmpeg_path: OsString,
    temp_dir: PathBuf,
    progress_tracker: Arc<Mutex<ProgressTracker>>,
}

impl<R: tauri::Runtime> Ffmpeg<R> {
    pub fn new(
        app: AppHandle<R>,
        progress_channel: Channel<ExportEvent>,
    ) -> Result<Self, AppError> {
        match app.shell().sidecar("donkidunk_ffmpeg") {
            Ok(ffmpeg) => {
                let ffmpeg_std_command = std::process::Command::from(ffmpeg);

                let command = std::process::Command::from(ffmpeg_std_command);

                let parts_dir = match app.path().temp_dir() {
                    Ok(temp_dir) => {
                        let unique_id = Uuid::new_v4();
                        let dir = temp_dir.join(format!("donkidunk_video_parts_{}", unique_id));

                        if !dir.exists() {
                            std::fs::create_dir_all(&dir).map_err(|e| {
                                FfmpegError::FfmpegSidecarAccess(format!(
                                    "[ffmpeg-sidecar] Failed to create temp dir: {}",
                                    e
                                ))
                            })?;
                        }
                        dir
                    }
                    _ => {
                        return Err(anyhow!("Failed to get temp dir").into());
                    }
                };

                Ok(Self {
                    app,
                    ffmpeg_path: command.get_program().to_owned(),
                    temp_dir: parts_dir,
                    on_progress_channel: Arc::new(progress_channel),
                    progress_tracker: Arc::new(Mutex::new(ProgressTracker {
                        total_clips_extracted: 0.0,
                        total_clips_to_extract: 0.0,
                        final_clip_total_duration: 0.0,
                        merge_progress: 0.0,
                    })),
                })
            }
            Err(e) => Err(FfmpegError::FfmpegSidecarAccess(format!(
                "[ffmpeg-sidecar] Error: {}",
                e
            ))
            .into()),
        }
    }

    fn create_default_split_command(
        &self,
        start_time: &str,
        end_time: &str,
        source_path: &str,
        output_path: &PathBuf,
    ) -> Command {
        let mut cmd = Command::new(&self.ffmpeg_path);

        cmd.arg("-hide_banner")
            .arg("-i")
            .arg(source_path)
            .arg("-ss")
            .arg(start_time)
            .arg("-to")
            .arg(end_time)
            .arg("-c")
            .arg("copy")
            .arg("-avoid_negative_ts")
            .arg("make_zero")
            .arg(&output_path)
            .stderr(Stdio::piped());

        cmd
    }

    fn extract_clips<'a>(
        &'a self,
        source_path: &'a str,
        ranges: &'a Vec<(f32, f32)>,
    ) -> Vec<impl Future<Output = Result<PathBuf, FfmpegError>> + 'a> {
        let tasks: Vec<_> = ranges
            .into_iter()
            .map(|(start, end)| async move {
                let start_time = parse_time_to_ffmpeg_format(start);
                let end_time = parse_time_to_ffmpeg_format(end);

                log::debug!("Starting cut: {} to {}", start_time, end_time);

                let output_name = format!(
                    "part_{}_{}{}",
                    start,
                    end,
                    &source_path[source_path.rfind('.').unwrap()..]
                );

                let output_path = self.temp_dir.join(output_name);

                let mut cmd = self.create_default_split_command(
                    &start_time,
                    &end_time,
                    &source_path,
                    &output_path,
                );

                let status = cmd.spawn()?.wait().await?;

                if !status.success() {
                    return Err(FfmpegError::FfmpegExecution(format!(
                        "FFMPEG command failed with status: {}",
                        status
                    )));
                }

                let total_clips_extracted = {
                    let mut tracker = self.progress_tracker.lock().await;
                    tracker.final_clip_total_duration += end - start;
                    tracker.total_clips_extracted += 1.0;
                    tracker.total_clips_extracted
                };

                let _ = self.on_progress_channel.send(ExportEvent {
                    progress: (total_clips_extracted) / (ranges.len() as f32 * 2.0),
                });

                log::debug!("Cut finished: {} - {}", start_time, end_time);

                Ok::<PathBuf, FfmpegError>(output_path)
            })
            .collect();

        tasks
    }

    async fn merge_clips(
        &self,
        clips_paths: &Vec<PathBuf>,
        out_path: &str,
    ) -> Result<(), FfmpegError> {
        log::debug!("Starting concat...");

        let full_arg = clips_paths
            .iter()
            .map(|p| format!("file '{}'", p.to_string_lossy()))
            .collect::<Vec<String>>()
            .join("\n");

        let file_parts_path = self.temp_dir.join("parts.txt");

        let mut concat_command = Command::new(&self.ffmpeg_path);

        concat_command
            .arg("-hide_banner")
            .arg("-f")
            .arg("concat")
            .arg("-safe")
            .arg("0")
            .arg("-i")
            .arg(&file_parts_path)
            .arg("-c")
            .arg("copy")
            .arg("-y")
            .arg(out_path)
            .stderr(Stdio::piped());

        log::debug!("Spawning command");
        let mut child = concat_command.spawn().map_err(|e| FfmpegError::from(e))?;

        let stderr = child.stderr.take().ok_or(FfmpegError::StderrCapture)?;

        let reader = BufReader::new(stderr);

        let total_duration = {
            let tracker = self.progress_tracker.lock().await;
            tracker.final_clip_total_duration
        };

        let mut tasks = Vec::new();

        tasks.push(tokio::spawn(async move {
            let mut file = File::create(file_parts_path).await?;

            file.write_all(full_arg.as_bytes()).await?;

            child.wait().await?;

            Ok::<(), FfmpegError>(())
        }));

        let cloned_channel = self.on_progress_channel.clone();

        tasks.push(tokio::spawn(async move {
            process_progress(reader, total_duration, cloned_channel).await?;

            Ok::<(), FfmpegError>(())
        }));

        log::debug!("Running command");
        for task in tasks {
            match task.await {
                Ok(_) => {}
                Err(e) => return Err(e.into()),
            }
        }

        Ok(())
    }

    fn cleanup(&self) -> Result<(), FfmpegError> {
        std::fs::remove_dir_all(&self.temp_dir)
            .map_err(|e| FfmpegError::FfmpegCleanupFailed(format!("{}", e)))
    }

    pub async fn export_video(
        &self,
        source_path: &str,
        out_path: &str,
        ranges: &Vec<(f32, f32)>,
    ) -> Result<(), AppError> {
        let start = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();

        let mut clips_paths = Vec::new();

        {
            let mut tracker = self.progress_tracker.lock().await;
            tracker.final_clip_total_duration = 0.0;
            tracker.total_clips_to_extract = ranges.len() as f32;
            tracker.total_clips_extracted = 0.0;
            tracker.merge_progress = 0.0;
        }

        let tasks = self.extract_clips(source_path, ranges);

        // TODO: think what to do if 1 of the tasks fail
        for task in tasks {
            match task.await {
                Ok(path) => clips_paths.push(path),
                Err(e) => return Err(e.into()),
            }
        }

        self.merge_clips(&clips_paths, out_path).await?;

        let end = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();

        log::debug!("Cleaning up");
        self.cleanup()?;

        log::debug!(
            "Time elapsed in seconds: {:?}",
            end.as_secs() - start.as_secs()
        );

        Ok(())
    }
}
