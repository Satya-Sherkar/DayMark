export interface BackupFileInfo {
  file_name: string;
  file_path: string;
  size_bytes: number;
  created_at: string;
}

export interface RestoreResult {
  tasks_restored: number;
  projects_restored: number;
  categories_restored: number;
  reminders_restored: number;
  settings_restored: number;
}
