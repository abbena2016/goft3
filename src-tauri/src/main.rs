// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

// فحص جاهزية النظام ومعلومات التطبيق
#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "app_name": "GOFT3",
        "version": "1.1.1",
        "engine": "Tauri v2 + Rust",
        "memory_optimized": true,
        "os": std::env::consts::OS
    }))
}

// مسار تخزين قاعدة البيانات المحلية gft3.db في مجلد التطبيق
#[tauri::command]
fn get_db_path(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    let db_path: PathBuf = app_dir.join("gft3.db");
    Ok(db_path.to_string_lossy().into_owned())
}

// حفظ أو تحديث نسخة احتياطية من قاعدة البيانات محلياً بسرعة فائقة
#[tauri::command]
fn save_local_backup(app: tauri::AppHandle, data_bytes: Vec<u8>) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let file_path = app_dir.join("gft3.db");
    fs::write(&file_path, data_bytes).map_err(|e| format!("Failed to write gft3.db: {}", e))?;

    Ok(file_path.to_string_lossy().into_owned())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_db_path,
            save_local_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running GOFT3 tauri application");
}
