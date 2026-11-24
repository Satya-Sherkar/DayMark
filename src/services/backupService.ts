import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { BackupFileInfo, RestoreResult } from "../types/backup";

export const backupService = {
  async exportBackupJson(targetPath?: string): Promise<string> {
    return invoke<string>("export_backup_json", { targetPath: targetPath || null });
  },

  async promptAndExportBackupJson(): Promise<string | null> {
    const defaultFileName = `daymark_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const selectedPath = await save({
      title: "Export Daymark Backup",
      defaultPath: defaultFileName,
      filters: [{ name: "JSON Backup", extensions: ["json"] }],
    });

    if (!selectedPath) return null;
    return this.exportBackupJson(selectedPath);
  },

  async importBackupJson(sourcePath: string, merge: boolean = false): Promise<RestoreResult> {
    return invoke<RestoreResult>("import_backup_json", { sourcePath, merge });
  },

  async promptAndImportBackupJson(merge: boolean = false): Promise<RestoreResult | null> {
    const selectedPath = await open({
      title: "Select Daymark Backup to Restore",
      multiple: false,
      directory: false,
      filters: [{ name: "JSON Backup", extensions: ["json"] }],
    });

    if (!selectedPath || typeof selectedPath !== "string") return null;
    return this.importBackupJson(selectedPath, merge);
  },

  async exportDatabaseSnapshot(targetPath?: string): Promise<string> {
    return invoke<string>("export_database_snapshot", { targetPath: targetPath || null });
  },

  async promptAndExportDatabaseSnapshot(): Promise<string | null> {
    const defaultFileName = `daymark_snapshot_${new Date().toISOString().slice(0, 10)}.db`;
    const selectedPath = await save({
      title: "Export SQLite Snapshot",
      defaultPath: defaultFileName,
      filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }],
    });

    if (!selectedPath) return null;
    return this.exportDatabaseSnapshot(selectedPath);
  },

  async listBackups(): Promise<BackupFileInfo[]> {
    return invoke<BackupFileInfo[]>("list_backups");
  },
};
