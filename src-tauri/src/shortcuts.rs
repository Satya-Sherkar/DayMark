use tauri::{App, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Safely unhides, restores, and gives keyboard focus to the main application window.
pub fn show_and_focus_main_window<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Brings the main window forward and emits the `open-quick-add` event to pop open the Task creation modal.
pub fn trigger_quick_add<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    show_and_focus_main_window(app);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("open-quick-add", ());
    }
    let _ = app.emit("open-quick-add", ());
}

/// Sets up the global shortcut listener using Tauri's native shortcut plugin.
pub fn setup_global_shortcut(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

    if let Err(err) = app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            trigger_quick_add(app);
        }
    }) {
        eprintln!(
            "Notice: Global shortcut Ctrl+Shift+Space registration info: {}",
            err
        );
    }

    Ok(())
}
