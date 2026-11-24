import { invoke } from "@tauri-apps/api/core";

export const settingsService = {
  async isAutostartEnabled(): Promise<boolean> {
    try {
      return await invoke<boolean>("is_autostart_enabled");
    } catch (err) {
      console.warn("Could not query autostart status:", err);
      return false;
    }
  },

  async setAutostartEnabled(enabled: boolean): Promise<void> {
    await invoke<void>("set_autostart_enabled", { enabled });
  },

  async getSetting(key: string): Promise<string | null> {
    return await invoke<string | null>("get_setting", { key });
  },

  async setSetting(key: string, value: string): Promise<void> {
    await invoke<void>("set_setting", { key, value });
  },
};
