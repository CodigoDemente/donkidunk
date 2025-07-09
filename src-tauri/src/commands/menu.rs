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

#[cfg(test)]
mod tests {
    use super::*;

    mod enable_item {
        use super::*;

        #[test]
        fn should_enable_item_by_id() {
            let app = tauri::test::mock_app();
            let mock_id = "test_menu";
            let mock_text = "Test Menu";

            let mock_menu = tauri::menu::Menu::new(app.handle()).unwrap();

            let menu_item = tauri::menu::MenuItemBuilder::with_id(mock_id, mock_text)
                .build(app.handle())
                .unwrap();

            mock_menu.append(&menu_item).unwrap();

            app.set_menu(mock_menu).unwrap();

            set_menu_item_enabling_status(app.handle().to_owned(), mock_id, false).unwrap();

            assert!(!menu_item.is_enabled().unwrap());
        }

        #[test]
        fn should_return_ok_if_menu_not_found() {
            let app = tauri::test::mock_app();
            let menu_id = "non_existent_menu";

            let result = set_menu_item_enabling_status(app.handle().to_owned(), menu_id, true);

            assert!(result.is_ok());
        }
    }
}
