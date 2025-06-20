// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::{Builder, generate_handler};
use std::process::Command;
use std::env;

/// A Git profile (name, email, ssh key path)
#[derive(Serialize, Deserialize)]
struct Profile {
  label: String,
  name: String,
  email: String,
  ssh_key: String,
}

/// List available profiles (configurable via environment variables)
#[tauri::command]
fn list_profiles() -> Vec<Profile> {
  let home_dir = env::var("HOME").unwrap_or_else(|_| "/home/user".to_string());
  
  vec![
    Profile {
      label: "Work".into(),
      name: env::var("GIT_WORK_NAME").unwrap_or_else(|_| "John Doe".to_string()),
      email: env::var("GIT_WORK_EMAIL").unwrap_or_else(|_| "john.doe@company.com".to_string()),
      ssh_key: env::var("GIT_WORK_SSH_KEY").unwrap_or_else(|_| format!("{}/.ssh/id_ed25519_work", home_dir)),
    },
    Profile {
      label: "Personal".into(),
      name: env::var("GIT_PERSONAL_NAME").unwrap_or_else(|_| "John Doe".to_string()),
      email: env::var("GIT_PERSONAL_EMAIL").unwrap_or_else(|_| "john.doe@personal.com".to_string()),
      ssh_key: env::var("GIT_PERSONAL_SSH_KEY").unwrap_or_else(|_| format!("{}/.ssh/id_ed25519_personal", home_dir)),
    },
  ]
}

/// Get current profile for the given scope ("global" or "local")
#[tauri::command]
fn get_current_profile(scope: String) -> Option<Profile> {
  let get = |key: &str| -> Option<String> {
    let output = Command::new("git")
      .args(&["config", &format!("--{}", scope), key])
      .output()
      .ok()?;
    if output.status.success() {
      Some(String::from_utf8_lossy(&output.stdout).trim().into())
    } else {
      None
    }
  };
  let name = get("user.name")?;
  let email = get("user.email")?;
  Some(Profile {
    label: "Custom".into(),
    name,
    email,
    ssh_key: "".into(),
  })
}

/// Switch profile for the given scope
#[tauri::command]
fn switch_profile(scope: String, profile: Profile) -> Result<(), String> {
  // Set user.name and user.email
  let status_name = Command::new("git")
    .args(&["config", &format!("--{}", scope), "user.name", &profile.name])
    .status()
    .map_err(|e| e.to_string())?;
  if !status_name.success() {
    return Err("Failed to set user.name".into());
  }
  let status_email = Command::new("git")
    .args(&["config", &format!("--{}", scope), "user.email", &profile.email])
    .status()
    .map_err(|e| e.to_string())?;
  if !status_email.success() {
    return Err("Failed to set user.email".into());
  }
  // Set core.sshCommand
  let ssh_cmd = format!("ssh -i {} -o IdentitiesOnly=yes", profile.ssh_key);
  let status_ssh = Command::new("git")
    .args(&["config", &format!("--{}", scope), "core.sshCommand", &ssh_cmd])
    .status()
    .map_err(|e| e.to_string())?;
  if !status_ssh.success() {
    return Err("Failed to set core.sshCommand".into());
  }
  Ok(())
}

fn main() {
  Builder::default()
    .invoke_handler(generate_handler![list_profiles, get_current_profile, switch_profile])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
