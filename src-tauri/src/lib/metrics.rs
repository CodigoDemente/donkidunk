use csv::WriterBuilder;
use log::debug;

use crate::{
    errors::{AppError, CsvError},
    timelinerepository::{TimelineRepository, TimelineRepositoryTrait},
};

#[derive(serde::Serialize)]
struct CsvLine {
    category: String,
    button: String,
    tags: Vec<u8>,
}

pub async fn generate_clips_csv(
    timeline_repository: &TimelineRepository,
    out_path: &str,
) -> Result<(), AppError> {
    debug!("Generating clips CSV in path: {}", out_path);

    let mut writer = WriterBuilder::new()
        .has_headers(false)
        .from_path(out_path)
        .map_err(|e| AppError::IoError(e.to_string()))?;

    let tags = timeline_repository.get_tags().await?;

    let mut header = Vec::new();
    header.push("category".to_string());
    header.push("button".to_string());
    header.extend(tags.iter().cloned());

    writer
        .write_record(&header)
        .map_err(|e| CsvError::WriteError(e.to_string()))?;

    timeline_repository
        .get_and_process_clips(|clip| {
            debug!("Processing clip: {}", clip.button);
            let clip_tags = tags
                .iter()
                .map(|tag| {
                    if clip.tags.contains(tag) {
                        u8::from(true)
                    } else {
                        u8::from(false)
                    }
                })
                .collect();

            let line = CsvLine {
                category: clip.category,
                button: clip.button,
                tags: clip_tags,
            };

            writer
                .serialize(&line)
                .map_err(|e| CsvError::WriteError(e.to_string()))?;
            Ok(())
        })
        .await?;

    debug!("Flushing writer");

    writer
        .flush()
        .map_err(|e| CsvError::WriteError(e.to_string()))?;

    Ok(())
}
