use anyhow::Result;
use tauri::{
    App, AppHandle, Emitter, Error,
    menu::{Menu, MenuEvent, MenuId, MenuItemBuilder, MenuItemKind, Submenu, SubmenuBuilder},
};

pub enum MenuItemId {
    OpenProject,
    NewProject,
    ImportVideo,
    SaveProject,
    SaveProjectAs,
    CloseProject,
    Undo,
    Redo,
    SaveButtonBoard,
    Logout,
    Unknown,
}

impl From<MenuItemId> for MenuId {
    fn from(id: MenuItemId) -> Self {
        match id {
            MenuItemId::OpenProject => MenuId::new("open_project"),
            MenuItemId::NewProject => MenuId::new("new_project"),
            MenuItemId::ImportVideo => MenuId::new("import_video"),
            MenuItemId::SaveProject => MenuId::new("save_project"),
            MenuItemId::SaveProjectAs => MenuId::new("save_project_as"),
            MenuItemId::CloseProject => MenuId::new("close_project"),
            MenuItemId::Undo => MenuId::new("undo"),
            MenuItemId::Redo => MenuId::new("redo"),
            MenuItemId::SaveButtonBoard => MenuId::new("save_button_board"),
            MenuItemId::Logout => MenuId::new("logout"),
            MenuItemId::Unknown => MenuId::new("unknown"),
        }
    }
}

impl From<MenuId> for MenuItemId {
    fn from(id: MenuId) -> Self {
        match id.0.as_str() {
            "open_project" => MenuItemId::OpenProject,
            "new_project" => MenuItemId::NewProject,
            "import_video" => MenuItemId::ImportVideo,
            "save_project" => MenuItemId::SaveProject,
            "save_project_as" => MenuItemId::SaveProjectAs,
            "close_project" => MenuItemId::CloseProject,
            "undo" => MenuItemId::Undo,
            "redo" => MenuItemId::Redo,
            "save_button_board" => MenuItemId::SaveButtonBoard,
            "logout" => MenuItemId::Logout,
            _ => MenuItemId::Unknown,
        }
    }
}

pub enum SubmenuId {
    Save,
    File,
    ButtonBoard,
    Edit,
    Help,
    About,
}

impl From<SubmenuId> for MenuId {
    fn from(id: SubmenuId) -> Self {
        match id {
            SubmenuId::Save => MenuId::new("save-menu"),
            SubmenuId::File => MenuId::new("file-menu"),
            SubmenuId::ButtonBoard => MenuId::new("button_board-menu"),
            SubmenuId::Edit => MenuId::new("edit-menu"),
            SubmenuId::Help => MenuId::new("help-menu"),
            SubmenuId::About => MenuId::new("about-submenu"),
        }
    }
}

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

    let open_project_item = MenuItemBuilder::with_id(MenuItemId::OpenProject, "Open Project")
        .accelerator("CmdOrCtrl+O")
        .build(handle)?;

    let new_project_item = MenuItemBuilder::with_id(MenuItemId::NewProject, "New Project")
        .accelerator("CmdOrCtrl+N")
        .build(handle)?;

    let import_video_item = MenuItemBuilder::with_id(MenuItemId::ImportVideo, "Import Video")
        .accelerator("CmdOrCtrl+I")
        .enabled(false)
        .build(handle)?;

    let save_project_item = MenuItemBuilder::with_id(MenuItemId::SaveProject, "Save Project")
        .accelerator("CmdOrCtrl+S")
        .enabled(false)
        .build(handle)?;

    let save_project_as_item =
        MenuItemBuilder::with_id(MenuItemId::SaveProjectAs, "Save Project As")
            .accelerator("CmdOrCtrl+Shift+S")
            .build(handle)?;

    let save_submenu = SubmenuBuilder::with_id(handle, SubmenuId::Save, "Save")
        .item(&save_project_item)
        .item(&save_project_as_item)
        .build()?;

    let close_project_item = MenuItemBuilder::with_id(MenuItemId::CloseProject, "Close Project")
        .accelerator("CmdOrCtrl+F4")
        .enabled(false)
        .build(handle)?;

    let file_submenu = SubmenuBuilder::with_id(handle, SubmenuId::File, "File")
        .items(&[
            &open_project_item,
            &new_project_item,
            &import_video_item,
            &save_submenu,
            &close_project_item,
        ])
        .build()?;

    let undo_item = MenuItemBuilder::with_id(MenuItemId::Undo, "Undo")
        .accelerator("CmdOrCtrl+Z")
        .enabled(false)
        .build(handle)?;

    let redo_item = MenuItemBuilder::with_id(MenuItemId::Redo, "Redo")
        .accelerator("CmdOrCtrl+Shift+Z")
        .enabled(false)
        .build(handle)?;

    let save_button_board_item =
        MenuItemBuilder::with_id(MenuItemId::SaveButtonBoard, "Save as preset")
            .enabled(false)
            .build(handle)?;

    let button_board_submenu =
        SubmenuBuilder::with_id(handle, SubmenuId::ButtonBoard, "Button Board")
            .item(&save_button_board_item)
            .build()?;

    let edit_submenu = SubmenuBuilder::with_id(handle, SubmenuId::Edit, "Edit")
        .items(&[&undo_item, &redo_item, &button_board_submenu])
        .build()?;

    // let help_submenu = SubmenuBuilder::with_id(handle, SubmenuId::Help, "Help")
    //     .text("option", "Help")
    //     .text("about", "About")
    //     .text("check_for_updates", "Check for Updates")
    //     .build()?;

    let about_menu = SubmenuBuilder::with_id(handle, SubmenuId::About, "About")
        .item(&MenuItemBuilder::with_id(MenuItemId::Logout, "Logout").build(handle)?)
        .build()?;

    #[cfg(target_os = "macos")]
    menu.append(&about_menu)?;

    menu.append(&file_submenu)?;
    menu.append(&edit_submenu)?;
    // menu.append(&help_submenu)?;

    #[cfg(not(target_os = "macos"))]
    menu.append(&about_menu)?;

    Ok(menu)
}

fn generic_event_handler<R: tauri::Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    let event_id = event.id.0;

    log::debug!("Menu event triggered: {event_id}");

    app.emit("menu", MenuEventData { id: event_id }).unwrap();
}
