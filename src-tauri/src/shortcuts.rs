use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{App, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub const QUICK_ADD_BASE_WIDTH: f64 = 640.0;
pub const QUICK_ADD_BASE_HEIGHT: f64 = 130.0;
const DEFAULT_ZOOM: f64 = 1.0;
const MIN_ZOOM: f64 = 0.5;
const MAX_ZOOM: f64 = 3.0;

static APP_ZOOM_BITS: AtomicU64 = AtomicU64::new(DEFAULT_ZOOM.to_bits());

/// Clamps and rounds the zoom scale factor to two decimal places.
pub fn normalize_zoom(zoom: f64) -> f64 {
    if !zoom.is_finite() {
        return DEFAULT_ZOOM;
    }
    let clamped = zoom.clamp(MIN_ZOOM, MAX_ZOOM);
    (clamped * 100.0).round() / 100.0
}

/// Returns the active application zoom scale factor shared across windows.
pub fn get_app_zoom() -> f64 {
    normalize_zoom(f64::from_bits(APP_ZOOM_BITS.load(Ordering::Relaxed)))
}

fn calculate_quick_add_size<R: tauri::Runtime>(
    window: &tauri::WebviewWindow<R>,
    zoom: f64,
) -> (f64, f64) {
    let mut width = (QUICK_ADD_BASE_WIDTH * zoom).round();
    let mut height = (QUICK_ADD_BASE_HEIGHT * zoom).round();

    if let Ok(Some(monitor)) = window.current_monitor() {
        let sf = monitor.scale_factor();
        let scale_factor = if sf > 0.0 { sf } else { 1.0 };
        let monitor_logical_w = (monitor.size().width as f64) / scale_factor;
        let monitor_logical_h = (monitor.size().height as f64) / scale_factor;
        width = width.min((monitor_logical_w * 0.92).floor().max(320.0));
        height = height.min((monitor_logical_h * 0.45).floor().max(100.0));
    }

    (width, height)
}

fn sync_quick_add_geometry<R: tauri::Runtime>(
    quick_window: &tauri::WebviewWindow<R>,
    zoom: f64,
) {
    let _ = quick_window.set_zoom(zoom);
    let (logical_w, logical_h) = calculate_quick_add_size(quick_window, zoom);
    let _ = quick_window.set_size(tauri::LogicalSize::new(logical_w, logical_h));

    if let Ok(Some(monitor)) = quick_window.current_monitor() {
        let screen_size = monitor.size();
        let sf = monitor.scale_factor();
        let scale_factor = if sf > 0.0 { sf } else { 1.0 };
        let physical_w = (logical_w * scale_factor).round() as i32;
        let x = ((screen_size.width as i32) - physical_w) / 2;
        let y = (screen_size.height as i32) / 4;
        let _ = quick_window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
    } else {
        let _ = quick_window.center();
    }
}

/// Persists the shared zoom scale factor and updates the `quick-add` spotlight bar zoom & size.
pub fn apply_zoom_to_quick_add<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    zoom: f64,
) -> f64 {
    let normalized = normalize_zoom(zoom);
    APP_ZOOM_BITS.store(normalized.to_bits(), Ordering::Relaxed);

    if let Some(quick_window) = app.get_webview_window("quick-add") {
        sync_quick_add_geometry(&quick_window, normalized);
    }

    normalized
}

/// Safely unhides, restores, and gives keyboard focus to the main application window.
pub fn show_and_focus_main_window<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Brings the sleek quick-add overlay window forward (Spotlight / Claude-style)
/// or falls back to main window if quick-add is unavailable.
pub fn trigger_quick_add<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(quick_window) = app.get_webview_window("quick-add") {
        sync_quick_add_geometry(&quick_window, get_app_zoom());
        let _ = quick_window.show();
        let _ = quick_window.unminimize();
        let _ = quick_window.set_focus();
        let _ = quick_window.emit("focus-quick-input", ());
    } else {
        show_and_focus_main_window(app);
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.emit("open-quick-add", ());
        }
        let _ = app.emit("open-quick-add", ());
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_zoom_clamps_and_handles_non_finite() {
        assert_eq!(normalize_zoom(f64::NAN), 1.0);
        assert_eq!(normalize_zoom(f64::INFINITY), 1.0);
        assert_eq!(normalize_zoom(0.2), 0.5);
        assert_eq!(normalize_zoom(4.5), 3.0);
        assert_eq!(normalize_zoom(1.1 + 0.2), 1.3);
    }
}
