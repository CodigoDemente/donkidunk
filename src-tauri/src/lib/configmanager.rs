use std::{
    fs::{self, File, create_dir_all},
    io::Write,
    path::PathBuf,
};

use log::warn;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use tauri::{App, Manager, Runtime, path::BaseDirectory};

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
pub enum UIMode {
    Simple,
    Advanced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ButtonBoard {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoardSize {
    events: u8,
    tags: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    locale: Locale,
    ui_mode: UIMode,
    board_size: BoardSize,
    button_boards: Vec<ButtonBoard>,
}

pub struct ConfigManager {
    config_file_path: PathBuf,
    button_board_dir: PathBuf,
    config: Config,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ButtonBoardWithPath {
    pub path: PathBuf,
    pub button_board: ButtonBoard,
}

impl ConfigManager {
    pub fn new<R: Runtime>(app: &App<R>) -> Self {
        let config_dir = app.path().app_config_dir().unwrap();

        if !config_dir.try_exists().unwrap() {
            create_dir_all(&config_dir).unwrap();
        }

        let config_file = config_dir.join(CONFIG_NAME);

        let mut config_data: Option<Config> = None;

        if config_file.try_exists().unwrap() {
            let config_reader = fs::File::open(&config_file).unwrap();

            let config_result = serde_json::from_reader(config_reader);

            if let Err(error) = config_result {
                // TODO: Alert the user that the config is corrupted and needs to be regenerated
                // TODO: Instead of deleting the file, rename it to a unique name like "corrupted_config_<timestamp>.json"
                warn!("Error deserializing config file: {:?}", error);
                fs::remove_file(&config_file).unwrap();
            } else {
                config_data = Some(config_result.unwrap());
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

    fn generate_default_config(config_file: &PathBuf) -> Config {
        let config_data = Config {
            locale: Locale::EN,
            ui_mode: UIMode::Simple,
            board_size: BoardSize {
                events: 15,
                tags: 85,
            },
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

    pub fn get_config(&self) -> &Config {
        &self.config
    }

    pub fn initialize_button_boards<R: Runtime>(
        &mut self,
        app: &App<R>,
    ) -> Result<(), ConfigError> {
        if !self.config.button_boards.is_empty() {
            return Ok(());
        }

        let beginner_button_board_asset_path = app
            .path()
            .resolve("assets/beginner_button_board.json", BaseDirectory::Resource)?;
        let advanced_button_board_asset_path = app
            .path()
            .resolve("assets/advanced_button_board.json", BaseDirectory::Resource)?;

        let beginner_button_board_id = uuid::Uuid::now_v7();

        let beginner_button_board_path = self
            .button_board_dir
            .join(format!("{beginner_button_board_id}.json"));

        fs::copy(beginner_button_board_asset_path, beginner_button_board_path)?;

        self.config.button_boards.push(ButtonBoard {
            id: beginner_button_board_id.to_string(),
            name: "Amateur coaching".to_string(),
            is_default: true,
        });

        let advanced_button_board_id = uuid::Uuid::now_v7();

        let advanced_button_board_path = self
            .button_board_dir
            .join(format!("{advanced_button_board_id}.json"));

        fs::copy(advanced_button_board_asset_path, advanced_button_board_path)?;

        self.config.button_boards.push(ButtonBoard {
            id: advanced_button_board_id.to_string(),
            name: "Professional coaching".to_string(),
            is_default: false,
        });

        self.write_config_to_file()?;

        Ok(())
    }

    pub fn get_button_board_paths(&self) -> Vec<ButtonBoardWithPath> {
        self.config
            .button_boards
            .iter()
            .map(|button_board| ButtonBoardWithPath {
                path: self
                    .button_board_dir
                    .join(format!("{}.json", button_board.id)),
                button_board: button_board.clone(),
            })
            .collect()
    }

    pub fn save_button_board(
        &mut self,
        board_id: String,
        board_name: String,
        is_default: bool,
        board_content: String,
    ) -> Result<PathBuf, ConfigError> {
        let board_path = self.button_board_dir.join(format!("{board_id}.json"));

        let mut board_file = fs::File::create(&board_path)?;

        board_file.write_all(board_content.as_bytes())?;

        let mut must_insert_new_board = true;

        for button_board in self.config.button_boards.iter_mut() {
            if is_default {
                button_board.is_default = false;
            }

            if button_board.id == board_id {
                must_insert_new_board = false;
                button_board.is_default = is_default;
            }
        }

        if must_insert_new_board {
            let new_button_board = ButtonBoard {
                id: board_id,
                name: board_name,
                is_default,
            };

            self.config.button_boards.push(new_button_board);
        }

        self.write_config_to_file()?;

        Ok(board_path)
    }

    pub fn set_board_size(&mut self, events: u8, tags: u8) -> Result<(), ConfigError> {
        if events + tags != 100 {
            return Err(ConfigError::InvalidBoardSize(format!(
                "events: {}, tags: {}",
                events, tags
            )));
        }

        self.config.board_size = BoardSize { events, tags };

        self.write_config_to_file()?;

        Ok(())
    }

    pub fn set_ui_mode(&mut self, ui_mode: UIMode) -> Result<(), ConfigError> {
        self.config.ui_mode = ui_mode;

        self.write_config_to_file()?;

        Ok(())
    }
}
