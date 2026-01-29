use chrono::Duration;
use windows_result::HRESULT;

use crate::errors::AppError;

const KEY_NOT_FOUND: HRESULT = HRESULT(0x80070002_u32 as i32);
const KEY_PATH: &str = "Software\\Codigo Demente\\Donkidunk";
const DEFAULT_APP_DURATION: Duration = Duration::weeks(12);

pub fn is_installation_expired() -> Result<bool, AppError> {
    let mut is_expired = false;

    #[cfg(windows)]
    {
        let key = windows_registry::CURRENT_USER
            .create(KEY_PATH)
            .map_err(|err| AppError::LicenseError(format!("{:?} {}", err.code(), err.message())))?;

        let expiration_date_result = key.get_u64("ExpirationDate");

        if let Err(err) = expiration_date_result {
            if err.code() == KEY_NOT_FOUND {
                use chrono::Utc;

                log::debug!("Expiration date not found. Setting default expiration date...");

                let expiration_date = Utc::now() + DEFAULT_APP_DURATION;

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
            use chrono::{DateTime, Utc};

            let nsecs = key.get_u32("ExpirationDateNanos").map_err(|err| {
                AppError::LicenseError(format!("{:?} {}", err.code(), err.message()))
            })?;

            let expiration_date =
                DateTime::from_timestamp(expiration_date as i64, nsecs).unwrap_or(Utc::now());

            is_expired = expiration_date < Utc::now();
        }
    }

    Ok(is_expired)
}
