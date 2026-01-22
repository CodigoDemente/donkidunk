use std::future::Future;

use futures::StreamExt;
use sqlx::SqlitePool;

use crate::errors::{AppError, DatabaseError};

pub struct ClipForDataExport {
    pub category: String,
    pub button: String,
    pub tags: Vec<String>,
}

#[derive(sqlx::FromRow)]
struct SQLClipForDataExport {
    category: String,
    button: String,
    tags: String,
}

#[derive(sqlx::FromRow)]
struct SQLTag {
    name: String,
}

pub struct TimelineRepository {
    db: SqlitePool,
}

pub trait TimelineRepositoryTrait {
    fn new(db: SqlitePool) -> Self;
    fn get_and_process_clips<F>(&self, processor: F) -> impl Future<Output = Result<(), AppError>>
    where
        F: FnMut(ClipForDataExport) -> Result<(), AppError>;
    fn get_tags(&self) -> impl Future<Output = Result<Vec<String>, AppError>>;
}

impl TimelineRepositoryTrait for TimelineRepository {
    fn new(db: SqlitePool) -> Self {
        Self { db }
    }

    async fn get_and_process_clips<F>(&self, mut processor: F) -> Result<(), AppError>
    where
        F: FnMut(ClipForDataExport) -> Result<(), AppError>,
    {
        let mut stream = sqlx::query_as::<_, SQLClipForDataExport>(
            "
            SELECT 
                c.name as category, 
                b.name as button, group_concat(t.name) as tags 
            FROM 
                timeline_entry te JOIN button b on te.button_id = b.id 
                JOIN category c on b.category_id = c.id 
                JOIN timeline_entry_tag tea on te.id = tea.timeline_entry_id 
                JOIN tag t on tea.tag_id = t.id GROUP BY te.id;
        ",
        )
        .fetch(&self.db);

        while let Some(result) = stream.next().await {
            let clip = result.map_err(DatabaseError::from)?;

            let transformed = ClipForDataExport {
                category: clip.category,
                button: clip.button,
                tags: clip.tags.split(',').map(|s| s.to_string()).collect(),
            };

            processor(transformed)?;
        }

        Ok(())
    }

    async fn get_tags(&self) -> Result<Vec<String>, AppError> {
        let tags = sqlx::query_as::<_, SQLTag>(
            "
            SELECT 
                name
            FROM 
                tag
            ORDER BY category_id, name;
        ",
        )
        .fetch(&self.db);

        Ok(tags.map(|tag| tag.unwrap().name).collect::<Vec<_>>().await)
    }
}
