use std::{
    fs::{self, create_dir_all, File},
    path::PathBuf,
};

use log::warn;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use tauri::{path::BaseDirectory, App, Manager, Runtime};

use crate::errors::ConfigError;

const CONFIG_NAME: &str = "donkidunk.json";
const BUTTON_BOARD_FOLDER: &str = "button_boards";

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ButtonBoard {
    id: String,
    name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    locale: Locale,
    ui_mode: UIMode,
    button_boards: Vec<ButtonBoard>,
}

pub struct ConfigManager {
    config_file_path: PathBuf,
    button_board_dir: PathBuf,
    config: Config,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ButtonBoardWithPath {
    path: PathBuf,
    button_board: ButtonBoard,
}

pub trait ConfigManagerTrait {
    fn new<R: Runtime>(app: &App<R>) -> Self;
    fn get_config(&self) -> &Config;
    fn set_config(&mut self, new_config: Config) -> Result<(), ConfigError>;
    fn initialize_button_boards<R: Runtime>(&mut self, app: &App<R>) -> Result<(), ConfigError>;
    fn get_button_board_paths(&self) -> Vec<ButtonBoardWithPath>;
}

impl ConfigManager {
    fn generate_default_config(config_file: &PathBuf) -> Config {
        let config_data = Config {
            locale: Locale::EN,
            ui_mode: UIMode::Simple,
            button_boards: vec![],
        };

        let file_object = fs::File::create(config_file).unwrap();

        serde_json::to_writer(file_object, &config_data).unwrap();

        config_data
    }

    pub fn write_config_to_file(&self) -> Result<(), ConfigError> {
        let config_file = File::create(&self.config_file_path)?;

        serde_json::to_writer(config_file, &self.config)?;

        Ok(())
    }
}

impl ConfigManagerTrait for ConfigManager {
    fn new<R: Runtime>(app: &App<R>) -> Self {
        let config_dir = app.path().app_config_dir().unwrap();

        if !config_dir.try_exists().unwrap() {
            create_dir_all(&config_dir).unwrap();
        }

        let config_file = config_dir.join(CONFIG_NAME);

        let mut config_data: Option<Config> = None;

        if config_file.try_exists().unwrap() {
            let config_reader = fs::File::open(&config_file).unwrap();

            let config_result = serde_json::from_reader(config_reader);

            if config_result.is_ok() {
                config_data = Some(config_result.unwrap());
            } else {
                // TODO: Alert the user that the config is corrupted and needs to be regenerated
                // TODO: Instead of deleting the file, rename it to a unique name like "corrupted_config_<timestamp>.json"
                warn!("Error deserializing config file: {:?}", config_result.err());
                fs::remove_file(&config_file).unwrap();
            }
        }

        if config_data.is_none() {
            config_data = Some(Self::generate_default_config(&config_file));
        }

        let button_board_dir = config_dir.join(BUTTON_BOARD_FOLDER);

        if !button_board_dir.try_exists().unwrap() {
            create_dir_all(&button_board_dir).unwrap();
        }

        Self {
            button_board_dir,
            config_file_path: config_file,
            config: config_data.unwrap(),
        }
    }

    fn get_config(&self) -> &Config {
        &self.config
    }

    fn set_config(&mut self, new_config: Config) -> Result<(), ConfigError> {
        self.config = new_config;

        self.write_config_to_file()?;

        Ok(())
    }

    fn initialize_button_boards<R: Runtime>(&mut self, app: &App<R>) -> Result<(), ConfigError> {
        if !self.config.button_boards.is_empty() {
            return Ok(());
        }

        let default_board_button_asset_path = app
            .path()
            .resolve("assets/default_board_button.json", BaseDirectory::Resource)?;

        let default_board_button_id = uuid::Uuid::new_v4();

        let default_board_button_path = self
            .button_board_dir
            .join(format!("{default_board_button_id}.json"));

        fs::copy(default_board_button_asset_path, default_board_button_path)?;

        self.config.button_boards.push(ButtonBoard {
            id: default_board_button_id.to_string(),
            name: "Default".to_string(),
        });

        self.write_config_to_file()?;

        Ok(())
    }

    fn get_button_board_paths(&self) -> Vec<ButtonBoardWithPath> {
        let button_board_paths = self
            .config
            .button_boards
            .iter()
            .map(|button_board| ButtonBoardWithPath {
                path: self
                    .button_board_dir
                    .join(format!("{}.json", button_board.id)),
                button_board: button_board.clone(),
            })
            .collect();

        button_board_paths
    }
}
