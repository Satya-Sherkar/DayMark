use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, Manager};
use crate::shortcuts;

pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let open_i = MenuItem::with_id(app, "open", "Open Daymark", true, None::<&str>)?;
    let quick_add_i = MenuItem::with_id(app, "quick_add", "Quick Add Task...", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit Daymark", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open_i, &quick_add_i, &sep, &quit_i])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or("Failed to find application default window icon for tray")?;

    let _tray = TrayIconBuilder::with_id("daymark-tray")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("Daymark — Offline Productivity")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "open" => {
                    shortcuts::show_and_focus_main_window(app);
                }
                "quick_add" => {
                    shortcuts::trigger_quick_add(app);
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.hide();
                    } else {
                        shortcuts::show_and_focus_main_window(app);
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
