use keyring::{Entry, Error};
use log::error;

use crate::errors::{AppError, AuthError};

const SERVICE: &str = "donkidunk";

pub struct SecureStore {
    credential: Entry,
}

impl SecureStore {
    pub fn new(user: String) -> Result<Self, AppError> {
        let credential = Entry::new(SERVICE, &user).map_err(SecureStore::map_err)?;

        Ok(Self { credential })
    }

    fn map_err(error: Error) -> AuthError {
        error!("Error creating credential: {error}");

        match error {
            Error::NoEntry => AuthError::CredentialNotFound(error.to_string()),
            _ => AuthError::CredentialStoreError(error.to_string()),
        }
    }

    pub fn create_entry(&self, value: String) -> Result<(), AppError> {
        self.credential
            .set_password(&value)
            .map_err(SecureStore::map_err)?;

        Ok(())
    }

    pub fn get_entry(&self) -> Result<String, AppError> {
        Ok(self
            .credential
            .get_password()
            .map_err(SecureStore::map_err)?)
    }

    pub fn delete_entry(&self) -> Result<(), AppError> {
        let res = self
            .credential
            .delete_credential()
            .map_err(SecureStore::map_err);

        if let Err(err) = res {
            match err {
                AuthError::CredentialNotFound(..) => return Ok(()),
                e => return Err(e.into()),
            }
        }

        Ok(())
    }
}
