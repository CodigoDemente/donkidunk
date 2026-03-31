use std::collections::HashMap;

use keyring::{Entry, Error};
use log::{debug, error};

use crate::errors::{AppError, AuthError};

const SERVICE: &str = "donkidunk";
const DEFAULT_TARGET: &str = "default";

pub struct SecureStore {
    credentials: HashMap<String, Entry>,
}

impl SecureStore {
    pub fn new(user: String) -> Result<Self, AppError> {
        Self::new_with_target(user, DEFAULT_TARGET.to_string())
    }

    pub fn new_with_targets(user: String, targets: Vec<String>) -> Result<Self, AppError> {
        let mut credentials = HashMap::new();

        for target in targets {
            let credential =
                Entry::new_with_target(&target, SERVICE, &user).map_err(Self::map_err)?;

            credentials.insert(target, credential);
        }

        Ok(Self { credentials })
    }

    pub fn new_with_target(user: String, target: String) -> Result<Self, AppError> {
        let credential = Entry::new_with_target(&target, SERVICE, &user).map_err(Self::map_err)?;
        let mut credentials = HashMap::new();
        credentials.insert(target.to_string(), credential);

        Ok(Self { credentials })
    }

    fn map_err(error: Error) -> AuthError {
        error!("Error creating credential: {error}");

        match error {
            Error::NoEntry => AuthError::CredentialNotFound(error.to_string()),
            _ => AuthError::CredentialStoreError(error.to_string()),
        }
    }

    pub fn create_entry(&mut self, target: String, value: String) -> Result<(), AuthError> {
        debug!("[DEBUG] STORING CREDENTIAL: {value}");
        if let Some(credential) = self.credentials.get_mut(&target) {
            credential.set_password(&value).map_err(Self::map_err)?;

            Ok(())
        } else {
            Err(AuthError::CredentialNotFound(target))
        }
    }

    pub fn get_entry(&self, target: String) -> Result<String, AuthError> {
        if let Some(credential) = self.credentials.get(&target) {
            let text = credential.get_password().map_err(Self::map_err)?;

            debug!("[DEBUG] GETTING CREDENTIAL: {text}");

            Ok(text)
        } else {
            Err(AuthError::CredentialNotFound(target))
        }
    }

    pub fn delete_entry(&mut self, target: String) -> Result<(), AuthError> {
        if let Some(credential) = self.credentials.get(&target) {
            let res = credential.delete_credential().map_err(Self::map_err);

            match res {
                Ok(()) | Err(AuthError::CredentialNotFound(..)) => {
                    return Ok(());
                }
                Err(err) => return Err(err),
            }
        }

        Ok(())
    }
}
