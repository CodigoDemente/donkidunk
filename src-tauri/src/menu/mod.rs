use anyhow::Result;
use tauri::{
    menu::{Menu, MenuEvent, MenuId, MenuItemBuilder, MenuItemKind, Submenu, SubmenuBuilder},
    App, AppHandle, Emitter, Error,
};

pub trait MenuExtensions {
    fn set_enabled_by_item_id(&self, id: &MenuId, enabled: bool) -> Result<()>;
}

fn find_item_and_set_enabled_by_id<R: tauri::Runtime>(
    items: &Vec<MenuItemKind<R>>,
    id: &MenuId,
    enabled: bool,
) -> Result<()> {
    log::debug!("Finding item by ID: {}", id.0);

    macro_rules! check_and_set_enabled_by_item_id {
        ($item:expr) => {
            if $item.id() == id {
                $item.set_enabled(enabled)?;
            }
        };
    }

    for item in items {
        log::debug!("Checking and setting enabled by item ID: {}", item.id().0);

        match item {
            MenuItemKind::Submenu(item) => item.set_enabled_by_item_id(id, enabled)?,
            MenuItemKind::MenuItem(item) => check_and_set_enabled_by_item_id!(item),
            MenuItemKind::Check(item) => check_and_set_enabled_by_item_id!(item),
            MenuItemKind::Icon(item) => check_and_set_enabled_by_item_id!(item),
            MenuItemKind::Predefined(_) => {}
        }
    }

    Ok(())
}

impl<R: tauri::Runtime> MenuExtensions for Menu<R> {
    fn set_enabled_by_item_id(&self, id: &MenuId, enabled: bool) -> Result<()> {
        find_item_and_set_enabled_by_id(&self.items()?, id, enabled)?;

        Ok(())
    }
}

impl<R: tauri::Runtime> MenuExtensions for Submenu<R> {
    fn set_enabled_by_item_id(&self, id: &MenuId, enabled: bool) -> Result<()> {
        if self.id() == id {
            self.set_enabled(enabled)?;
        } else {
            find_item_and_set_enabled_by_id(&self.items()?, id, enabled)?;
        }

        Ok(())
    }
}

#[derive(Debug, serde::Serialize, Clone)]
struct MenuEventData {
    id: String,
}

pub fn setup_menu<R: tauri::Runtime>(app: &mut App<R>) -> Result<(), Error> {
    let menu = build_menu(app)?;

    app.set_menu(menu)?;

    app.on_menu_event(|app, event| {
        generic_event_handler(app, event);
    });

    Ok(())
}

fn build_menu<R: tauri::Runtime>(app: &mut App<R>) -> Result<Menu<R>, Error> {
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
        .items(&[
            &open_project_item,
            &new_project_item,
            &import_video_item,
            &save_submenu,
        ])
        .build()?;

    let undo_item = MenuItemBuilder::with_id("undo", "Undo")
        .accelerator("CmdOrCtrl+Z")
        .enabled(false)
        .build(handle)?;

    let redo_item = MenuItemBuilder::with_id("redo", "Redo")
        .accelerator("CmdOrCtrl+Shift+Z")
        .enabled(false)
        .build(handle)?;

    let edit_submenu = SubmenuBuilder::with_id(handle, "edit-menu", "Edit")
        .items(&[&undo_item, &redo_item])
        .build()?;

    let help_submenu = SubmenuBuilder::with_id(handle, "help-menu", "Help")
        .text("option", "Help")
        .text("about", "About")
        .text("check_for_updates", "Check for Updates")
        .build()?;

    #[cfg(target_os = "macos")]
    menu.append(&about_menu)?;

    menu.append(&file_submenu)?;
    menu.append(&edit_submenu)?;
    menu.append(&help_submenu)?;

    #[cfg(not(target_os = "macos"))]
    menu.append(&about_menu)?;

    Ok(menu)
}

fn generic_event_handler<R: tauri::Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    let event_id = event.id.0;

    log::debug!("Menu event triggered: {event_id}");

    app.emit("menu_event", MenuEventData { id: event_id })
        .unwrap();
}
