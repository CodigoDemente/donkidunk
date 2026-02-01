use std::future::Future;

use sqlx::SqlitePool;
use tauri::{App, Runtime};
use tokio::sync::Mutex;

use crate::{
    configmanager::{ConfigManager, ConfigManagerTrait},
    errors::AppError,
    timelinerepository::{TimelineRepository, TimelineRepositoryTrait},
};

pub struct AppState {
    is_expired: bool,
    config_manager: ConfigManager,
    db: Option<SqlitePool>,
    timeline_repository: Option<TimelineRepository>,
}

pub trait AppStateTrait {
    fn new<R: Runtime>(app: &App<R>, is_expired: bool) -> Mutex<Self>;
    fn get_config_manager(&self) -> &ConfigManager;
    fn get_config_manager_mut(&mut self) -> &mut ConfigManager;
    fn set_db(&mut self, db: SqlitePool) -> impl Future<Output = Result<(), AppError>> + Send;
    fn disconnect_db(&mut self) -> impl Future<Output = Result<(), AppError>> + Send;
    fn get_timeline_repository(&self) -> Option<&TimelineRepository>;
    fn get_is_expired(&self) -> bool;
}

impl AppStateTrait for AppState {
    fn new<R: Runtime>(app: &App<R>, is_expired: bool) -> Mutex<Self> {
        let mut config_manager = ConfigManager::new(app);
        config_manager.initialize_button_boards(app).unwrap();

        Mutex::new(Self {
            is_expired,
            config_manager,
            db: None,
            timeline_repository: None,
        })
    }

    fn get_config_manager(&self) -> &ConfigManager {
        &self.config_manager
    }

    fn get_config_manager_mut(&mut self) -> &mut ConfigManager {
        &mut self.config_manager
    }

    async fn set_db(&mut self, db: SqlitePool) -> Result<(), AppError> {
        self.timeline_repository = None;

        if let Some(old_conn) = self.db.take() {
            old_conn.close().await;
        }

        self.db = Some(db.clone());
        self.timeline_repository = Some(TimelineRepository::new(db.clone()));

        Ok(())
    }

    async fn disconnect_db(&mut self) -> Result<(), AppError> {
        self.timeline_repository = None;

        if let Some(db) = self.db.take() {
            db.close().await;
        }

        Ok(())
    }

    fn get_timeline_repository(&self) -> Option<&TimelineRepository> {
        self.timeline_repository.as_ref()
    }

    fn get_is_expired(&self) -> bool {
        self.is_expired
    }
}
