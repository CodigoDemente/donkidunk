use chrono::{DateTime, Duration, Utc};

use crate::errors::AppError;

const DEFAULT_APP_DURATION: Duration = Duration::weeks(12);

#[cfg(not(windows))]
const LICENSE_FILE_NAME: &str = "donkidunk.license";

/// Parses a license file content and returns the expiration date.
/// Format: "timestamp%nanos"
#[cfg(any(not(windows), test))]
fn parse_license_content(content: &str) -> Result<DateTime<Utc>, AppError> {
    let mut parts = content.split('%');

    let timestamp = parts
        .next()
        .ok_or_else(|| AppError::LicenseError("Missing timestamp in license file".to_string()))?
        .parse::<i64>()
        .map_err(|e| AppError::LicenseError(format!("Invalid timestamp: {:?}", e)))?;

    let nanos = parts
        .next()
        .ok_or_else(|| AppError::LicenseError("Missing nanos in license file".to_string()))?
        .parse::<u32>()
        .map_err(|e| AppError::LicenseError(format!("Invalid nanos: {:?}", e)))?;

    DateTime::from_timestamp(timestamp, nanos)
        .ok_or_else(|| AppError::LicenseError("Invalid timestamp values".to_string()))
}

/// Formats an expiration date to license file content.
/// Format: "timestamp%nanos"
#[cfg(any(not(windows), test))]
fn format_license_content(expiration_date: &DateTime<Utc>) -> String {
    format!(
        "{}%{}",
        expiration_date.timestamp(),
        expiration_date.timestamp_subsec_nanos()
    )
}

/// Checks if a given expiration date has passed.
fn is_date_expired(expiration_date: &DateTime<Utc>) -> bool {
    *expiration_date < Utc::now()
}

#[cfg(not(windows))]
fn get_license_dir(_identifier: &str, _app_name: &str) -> std::path::PathBuf {
    use std::path::Path;

    #[cfg(target_os = "linux")]
    {
        Path::new("/etc").join(_app_name).to_path_buf()
    }

    #[cfg(target_os = "macos")]
    {
        let path_expanded = shellexpand::tilde("~/Library/Application Support");
        Path::new(path_expanded.as_ref())
            .join(_identifier)
            .to_path_buf()
    }
}

#[cfg(not(windows))]
fn check_license_file(file_dir: &std::path::Path) -> Result<bool, AppError> {
    use std::{fs, io::Write};

    let expiration_date = Utc::now() + DEFAULT_APP_DURATION;

    log::debug!("File directory: {:?}", file_dir);

    if !file_dir.try_exists().unwrap_or(false) {
        log::debug!("File directory does not exist. Creating it...");
        fs::create_dir_all(file_dir).map_err(|err| AppError::LicenseError(format!("{:?}", err)))?;
    }

    let file_path = file_dir.join(LICENSE_FILE_NAME);

    log::debug!("File path: {:?}", file_path);

    if !file_path.try_exists().unwrap_or(false) {
        log::debug!("File path does not exist. Creating it...");

        let mut file = fs::File::create(&file_path)
            .map_err(|err| AppError::LicenseError(format!("{:?}", err)))?;

        file.write_all(format_license_content(&expiration_date).as_bytes())
            .map_err(|err| AppError::LicenseError(format!("{:?}", err)))?;

        Ok(false)
    } else {
        let license_content = fs::read_to_string(&file_path)
            .map_err(|err| AppError::LicenseError(format!("{:?}", err)))?;

        let expiration_date = parse_license_content(&license_content)?;
        Ok(is_date_expired(&expiration_date))
    }
}

#[cfg(windows)]
fn check_license_registry(key_path: &str) -> Result<bool, AppError> {
    use windows_result::HRESULT;

    const KEY_NOT_FOUND: HRESULT = HRESULT(0x80070002_u32 as i32);

    let expiration_date = Utc::now() + DEFAULT_APP_DURATION;

    let key = windows_registry::CURRENT_USER
        .create(key_path)
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
            .map_err(|err| AppError::LicenseError(format!("{:?} {}", err.code(), err.message())))?;

            Ok(false)
        } else {
            Err(AppError::LicenseError(format!(
                "{:?} {}",
                err.code(),
                err.message()
            )))
        }
    } else if let Ok(exp_timestamp) = expiration_date_result {
        let nsecs = key
            .get_u32("ExpirationDateNanos")
            .map_err(|err| AppError::LicenseError(format!("{:?} {}", err.code(), err.message())))?;

        let exp_date = DateTime::from_timestamp(exp_timestamp as i64, nsecs).unwrap_or(Utc::now());

        Ok(is_date_expired(&exp_date))
    } else {
        Ok(false)
    }
}

pub fn is_installation_expired(_identifier: &String, _app_name: &String) -> Result<bool, AppError> {
    #[cfg(windows)]
    {
        const KEY_PATH: &str = "Software\\Codigo Demente\\Donkidunk";
        check_license_registry(KEY_PATH)
    }

    #[cfg(not(windows))]
    {
        let file_dir = get_license_dir(_identifier, _app_name);
        check_license_file(&file_dir)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};

    // ==================== Common tests (all platforms) ====================

    #[test]
    fn test_parse_license_content_valid() {
        let now = Utc::now();
        let content = format!("{}%{}", now.timestamp(), now.timestamp_subsec_nanos());

        let result = parse_license_content(&content);

        assert!(result.is_ok());
        let parsed_date = result.unwrap();
        assert_eq!(parsed_date.timestamp(), now.timestamp());
        assert_eq!(
            parsed_date.timestamp_subsec_nanos(),
            now.timestamp_subsec_nanos()
        );
    }

    #[test]
    fn test_parse_license_content_missing_nanos() {
        let content = "1234567890";

        let result = parse_license_content(content);

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Missing nanos"));
    }

    #[test]
    fn test_parse_license_content_invalid_timestamp() {
        let content = "not_a_number%123";

        let result = parse_license_content(content);

        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Invalid timestamp")
        );
    }

    #[test]
    fn test_parse_license_content_invalid_nanos() {
        let content = "1234567890%not_a_number";

        let result = parse_license_content(content);

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid nanos"));
    }

    #[test]
    fn test_format_license_content() {
        let date = DateTime::from_timestamp(1234567890, 123456789).unwrap();

        let content = format_license_content(&date);

        assert_eq!(content, "1234567890%123456789");
    }

    #[test]
    fn test_format_and_parse_roundtrip() {
        let original = Utc::now();
        let content = format_license_content(&original);
        let parsed = parse_license_content(&content).unwrap();

        assert_eq!(original.timestamp(), parsed.timestamp());
        assert_eq!(
            original.timestamp_subsec_nanos(),
            parsed.timestamp_subsec_nanos()
        );
    }

    #[test]
    fn test_is_date_expired_future_date() {
        let future_date = Utc::now() + Duration::days(30);

        assert!(!is_date_expired(&future_date));
    }

    #[test]
    fn test_is_date_expired_past_date() {
        let past_date = Utc::now() - Duration::days(30);

        assert!(is_date_expired(&past_date));
    }

    #[test]
    fn test_default_duration_is_12_weeks() {
        assert_eq!(DEFAULT_APP_DURATION, Duration::weeks(12));
    }

    // ==================== Unix tests (macOS and Linux) ====================

    #[cfg(not(windows))]
    mod unix_tests {
        use super::*;
        use std::fs;
        use tempfile::TempDir;

        #[test]
        fn test_check_license_file_creates_new_file() {
            let temp_dir = TempDir::new().unwrap();
            let license_dir = temp_dir.path().join("test_app");

            let result = check_license_file(&license_dir);

            assert!(result.is_ok());
            assert!(!result.unwrap()); // Should not be expired on first run

            let license_file = license_dir.join(LICENSE_FILE_NAME);
            assert!(license_file.exists());
        }

        #[test]
        fn test_check_license_file_valid_license() {
            let temp_dir = TempDir::new().unwrap();
            let license_dir = temp_dir.path();

            // Create a valid license file with future expiration
            let future_date = Utc::now() + Duration::days(30);
            let content = format_license_content(&future_date);
            let license_file = license_dir.join(LICENSE_FILE_NAME);
            fs::write(&license_file, content).unwrap();

            let result = check_license_file(license_dir);

            assert!(result.is_ok());
            assert!(!result.unwrap()); // Should not be expired
        }

        #[test]
        fn test_check_license_file_expired_license() {
            let temp_dir = TempDir::new().unwrap();
            let license_dir = temp_dir.path();

            // Create an expired license file
            let past_date = Utc::now() - Duration::days(30);
            let content = format_license_content(&past_date);
            let license_file = license_dir.join(LICENSE_FILE_NAME);
            fs::write(&license_file, content).unwrap();

            let result = check_license_file(license_dir);

            assert!(result.is_ok());
            assert!(result.unwrap()); // Should be expired
        }

        #[test]
        fn test_check_license_file_corrupted_content() {
            let temp_dir = TempDir::new().unwrap();
            let license_dir = temp_dir.path();

            // Create a corrupted license file
            let license_file = license_dir.join(LICENSE_FILE_NAME);
            fs::write(&license_file, "corrupted_content").unwrap();

            let result = check_license_file(license_dir);

            assert!(result.is_err());
        }

        #[test]
        fn test_check_license_file_creates_parent_directories() {
            let temp_dir = TempDir::new().unwrap();
            let license_dir = temp_dir.path().join("nested").join("dirs").join("app");

            let result = check_license_file(&license_dir);

            assert!(result.is_ok());
            assert!(license_dir.exists());
        }

        #[cfg(target_os = "linux")]
        #[test]
        fn test_get_license_dir_linux() {
            let dir = get_license_dir("com.test.app", "testapp");

            assert_eq!(dir, std::path::PathBuf::from("/etc/testapp"));
        }

        #[cfg(target_os = "macos")]
        #[test]
        fn test_get_license_dir_macos() {
            use std::path::PathBuf;

            let dir = get_license_dir("com.test.app", "testapp");

            let expected = PathBuf::from(
                shellexpand::tilde("~/Library/Application Support/com.test.app").as_ref(),
            );
            assert_eq!(dir, expected);
        }
    }

    // ==================== Windows tests ====================

    #[cfg(windows)]
    mod windows_tests {
        use super::*;

        const TEST_KEY_BASE: &str = "Software\\Codigo Demente\\Donkidunk\\Test";

        fn cleanup_test_registry(key_path: &str) {
            let _ = windows_registry::CURRENT_USER.remove_tree(key_path);
        }

        #[test]
        fn test_check_license_registry_creates_new_key() {
            let key_path = format!("{}\\creates_new_key", TEST_KEY_BASE);
            cleanup_test_registry(&key_path);

            let result = check_license_registry(&key_path);

            assert!(result.is_ok());
            assert!(!result.unwrap()); // Should not be expired on first run

            cleanup_test_registry(&key_path);
        }

        #[test]
        fn test_check_license_registry_valid_license() {
            let key_path = format!("{}\\valid_license", TEST_KEY_BASE);
            cleanup_test_registry(&key_path);

            // Create a valid license with future expiration
            let future_date = Utc::now() + Duration::days(30);
            let key = windows_registry::CURRENT_USER.create(&key_path).unwrap();
            key.set_u64("ExpirationDate", future_date.timestamp() as u64)
                .unwrap();
            key.set_u32("ExpirationDateNanos", future_date.timestamp_subsec_nanos())
                .unwrap();

            let result = check_license_registry(&key_path);

            assert!(result.is_ok());
            assert!(!result.unwrap()); // Should not be expired

            cleanup_test_registry(&key_path);
        }

        #[test]
        fn test_check_license_registry_expired_license() {
            let key_path = format!("{}\\expired_license", TEST_KEY_BASE);
            cleanup_test_registry(&key_path);

            // Create an expired license
            let past_date = Utc::now() - Duration::days(30);
            let key = windows_registry::CURRENT_USER.create(&key_path).unwrap();
            key.set_u64("ExpirationDate", past_date.timestamp() as u64)
                .unwrap();
            key.set_u32("ExpirationDateNanos", past_date.timestamp_subsec_nanos())
                .unwrap();

            let result = check_license_registry(&key_path);

            assert!(result.is_ok());
            assert!(result.unwrap()); // Should be expired

            cleanup_test_registry(&key_path);
        }

        #[test]
        fn test_check_license_registry_missing_nanos() {
            let key_path = format!("{}\\missing_nanos", TEST_KEY_BASE);
            cleanup_test_registry(&key_path);

            // Create a license with only timestamp (missing nanos)
            let future_date = Utc::now() + Duration::days(30);
            let key = windows_registry::CURRENT_USER.create(&key_path).unwrap();
            key.set_u64("ExpirationDate", future_date.timestamp() as u64)
                .unwrap();
            // Note: Not setting ExpirationDateNanos

            let result = check_license_registry(&key_path);

            assert!(result.is_err()); // Should fail due to missing nanos

            cleanup_test_registry(&key_path);
        }
    }
}
