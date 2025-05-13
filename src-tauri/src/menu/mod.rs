use tauri::{
    menu::{Menu, MenuEvent, MenuItemBuilder, SubmenuBuilder},
    App, AppHandle, Emitter,
};

#[derive(Debug, serde::Serialize, Clone)]
struct MenuEventData {
    id: String,
}

pub fn setup_menu(app: &App) -> Result<(), tauri::Error> {
    let menu = build_menu(app)?;

    app.set_menu(menu)?;

    app.on_menu_event(generic_event_handler);

    Ok(())
}

fn build_menu(app: &App) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let handle = app.handle();

    let menu = Menu::new(handle)?;

    let about_menu = SubmenuBuilder::with_id(handle, "about-submenu", "About")
        .item(&MenuItemBuilder::with_id("about", "About").build(handle)?)
        .build()?;

    let open_project_item = MenuItemBuilder::with_id("open_project", "Open Project")
        .accelerator("CmdOrCtrl+O")
        .build(handle)?;

    let new_project_item = MenuItemBuilder::with_id("new_project", "New Project")
        .accelerator("CmdOrCtrl+N")
        .build(handle)?;

    let import_video_item = MenuItemBuilder::with_id("import_video", "Import Video")
        .accelerator("CmdOrCtrl+I")
        .enabled(false)
        .build(handle)?;

    let save_project_item = MenuItemBuilder::with_id("save_project", "Save Project")
        .accelerator("CmdOrCtrl+S")
        .enabled(false)
        .build(handle)?;

    let save_project_as_item = MenuItemBuilder::with_id("save_project_as", "Save Project As")
        .accelerator("CmdOrCtrl+Shift+S")
        .build(handle)?;

    let save_submenu = SubmenuBuilder::with_id(handle, "save-menu", "Save")
        .item(&save_project_item)
        .item(&save_project_as_item)
        .build()?;

    let file_submenu = SubmenuBuilder::with_id(handle, "file-menu", "File")
        .items(&[&open_project_item, &new_project_item, &import_video_item, &save_submenu])
        .build()?;

    let help_submenu = SubmenuBuilder::with_id(handle, "help-menu", "Help")
        .text("option", "Help")
        .text("about", "About")
        .text("check_for_updates", "Check for Updates")
        .build()?;

    #[cfg(target_os = "macos")]
    menu.append(&about_menu)?;

    menu.append(&file_submenu)?;
    menu.append(&help_submenu)?;

    #[cfg(not(target_os = "macos"))]
    menu.append(&about_menu)?;

    Ok(menu)
}

fn generic_event_handler(app: &AppHandle, event: MenuEvent) {
    let event_id = event.id.0;

    log::debug!("Menu event triggered: {}", event_id);

    app.emit("menu_event", MenuEventData { id: event_id })
        .unwrap();
}
