use chrono::{DateTime, Duration, Utc};

use crate::errors::AppError;

const DEFAULT_APP_DURATION: Duration = Duration::weeks(12);

pub fn is_installation_expired(_identifier: &String, _app_name: &String) -> Result<bool, AppError> {
    let mut is_expired = false;
    let expiration_date = Utc::now() + DEFAULT_APP_DURATION;

    #[cfg(windows)]
    {
        use windows_registry::HRESULT;

        const KEY_NOT_FOUND: HRESULT = HRESULT(0x80070002_u32 as i32);
        const KEY_PATH: &str = "Software\\Codigo Demente\\Donkidunk";

        let key = windows_registry::CURRENT_USER
            .create(KEY_PATH)
            .map_err(|err| AppError::LicenseError(format!("{:?} {}", err.code(), err.message())))?;

        let expiration_date_result = key.get_u64("ExpirationDate");

        if let Err(err) = expiration_date_result {
            if err.code() == KEY_NOT_FOUND {
                log::debug!("Expiration date not found. Setting default expiration date...");

                key.set_u64("ExpirationDate", expiration_date.timestamp() as u64)
                    .map_err(|err| {
                        AppError::LicenseError(format!("{:?} {}", err.code(), err.message()))
                    })?;
                key.set_u32(
                    "ExpirationDateNanos",
                    expiration_date.timestamp_subsec_nanos(),
                )
                .map_err(|err| {
                    AppError::LicenseError(format!("{:?} {}", err.code(), err.message()))
                })?;

                is_expired = false;
            } else {
                return Err(AppError::LicenseError(format!(
                    "{:?} {}",
                    err.code(),
                    err.message()
                )));
            }
        } else if let Ok(expiration_date) = expiration_date_result {
            let nsecs = key.get_u32("ExpirationDateNanos").map_err(|err| {
                AppError::LicenseError(format!("{:?} {}", err.code(), err.message()))
            })?;

            let expiration_date =
                DateTime::from_timestamp(expiration_date as i64, nsecs).unwrap_or(Utc::now());

            is_expired = expiration_date < Utc::now();
        }
    }

    #[cfg(not(windows))]
    {
        use std::{fs, path::Path};

        const FILE_NAME: &str = "donkidunk.license";

        let file_dir;

        #[cfg(target_os = "linux")]
        {
            file_dir = Path::new("/etc").join(_app_name).to_path_buf();
        }

        #[cfg(target_os = "macos")]
        {
            let path_expanded = shellexpand::tilde("~/Library/Application Support");
            file_dir = Path::new(path_expanded.as_ref())
                .join(_identifier)
                .to_path_buf();
        }

        log::debug!("File directory: {:?}", file_dir);

        if !file_dir.try_exists().unwrap() {
            log::debug!("File directory does not exist. Creating it...");
            fs::create_dir_all(&file_dir)
                .map_err(|err| AppError::LicenseError(format!("{:?}", err)))?;
        }

        let file_path = file_dir.join(FILE_NAME);

        log::debug!("File path: {:?}", file_path);

        if !file_path.try_exists().unwrap() {
            log::debug!("File path does not exist. Creating it...");

            use std::io::Write;

            let mut file = fs::File::create(&file_path)
                .map_err(|err| AppError::LicenseError(format!("{:?}", err)))?;

            file.write_all(
                format!(
                    "{}%{}",
                    expiration_date.timestamp(),
                    expiration_date.timestamp_subsec_nanos()
                )
                .as_bytes(),
            )
            .map_err(|err| AppError::LicenseError(format!("{:?}", err)))?;
        } else {
            let license_content = fs::read_to_string(&file_path)
                .map_err(|err| AppError::LicenseError(format!("{:?}", err)))?;

            let mut parts = license_content.split("%");

            let timestamp = parts
                .next()
                .unwrap()
                .parse::<i64>()
                .map_err(|e| AppError::LicenseError(format!("{:?}", e)))?;
            let nanos = parts
                .next()
                .unwrap()
                .parse::<u32>()
                .map_err(|e| AppError::LicenseError(format!("{:?}", e)))?;

            let expiration_date = DateTime::from_timestamp(timestamp, nanos).unwrap_or(Utc::now());

            is_expired = expiration_date < Utc::now();
        }
    }

    Ok(is_expired)
}
