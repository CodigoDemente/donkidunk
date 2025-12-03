use std::{
    fs::{self, create_dir_all, File},
    path::PathBuf,
};

use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use tauri::{App, Manager, Runtime};

use crate::errors::ConfigError;

const CONFIG_NAME: &str = "donkidunk.json";

#[derive(Debug, Clone, Copy, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
enum Locale {
    EN,
    ES,
}

#[derive(Debug, Clone, Copy, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
enum UIMode {
    Simple,
    Advanced,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Config {
    locale: Locale,
    ui_mode: UIMode,
}

pub struct ConfigManager {
    config_file_path: PathBuf,
    config: Config,
}

impl ConfigManager {
    pub fn new<R: Runtime>(app: &App<R>) -> Result<Self, ConfigError> {
        let config_dir = app.path().app_config_dir()?;

        if !config_dir.try_exists()? {
            create_dir_all(&config_dir)?;
        }

        let config_file = config_dir.join(CONFIG_NAME);

        let config_data: Config;

        if !config_file.try_exists()? {
            config_data = Config {
                locale: Locale::EN,
                ui_mode: UIMode::Simple,
            };

            let file_object = fs::File::create(&config_file)?;

            serde_json::to_writer(file_object, &config_data)?;
        } else {
            let config_reader = fs::File::open(&config_file)?;

            config_data = serde_json::from_reader(config_reader)?;
        }

        Ok(Self {
            config_file_path: config_file,
            config: config_data,
        })
    }

    pub fn get_config(&self) -> &Config {
        &self.config
    }

    pub fn set_config(&mut self, new_config: Config) -> Result<(), ConfigError> {
        self.config = new_config;

        self.write_config_to_file()?;

        Ok(())
    }

    fn write_config_to_file(&self) -> Result<(), ConfigError> {
        let config_file = File::create(&self.config_file_path)?;

        serde_json::to_writer(config_file, &self.config)?;

        Ok(())
    }
}
