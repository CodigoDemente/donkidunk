use crate::menu::MenuExtensions;

#[tauri::command]
pub fn set_menu_item_enabling_status<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    menu_id: &str,
    enabled: bool,
) -> Result<(), String> {
    let menu = app.menu();

    if let Some(menu) = menu {
        let menu_id = tauri::menu::MenuId::new(menu_id);
        menu.set_enabled_by_item_id(&menu_id, enabled)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}