use log::{debug, error, warn};
use tauri::{AppHandle, Runtime, Url};

use crate::auth::handle_return_url;

pub async fn process_deeplinks<R: Runtime>(app_handle: AppHandle<R>, links: Vec<Url>) {
    for url in links {
        debug!(
            "Procesing deeplink: {}{}{}",
            url.scheme(),
            url.authority(),
            url.path()
        );

        if url.has_authority() && url.authority() == "authorize" {
            if let Err(error) = handle_return_url(app_handle.clone(), url).await {
                error!("Error processing deeplink: {error}");
            }
        } else {
            warn!("Unrecognized deeplink: {url}");
        }
    }
}
