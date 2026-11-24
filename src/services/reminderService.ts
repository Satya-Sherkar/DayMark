import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { CreateReminderInput, DueReminder, Reminder } from "../types/reminder";

export const reminderService = {
  async createReminder(input: CreateReminderInput): Promise<Reminder> {
    return await invoke<Reminder>("create_reminder", { input });
  },

  async getReminder(id: string): Promise<Reminder> {
    return await invoke<Reminder>("get_reminder", { id });
  },

  async listRemindersForTask(taskId: string): Promise<Reminder[]> {
    return await invoke<Reminder[]>("list_reminders_for_task", { taskId });
  },

  async deleteReminder(id: string): Promise<void> {
    return await invoke<void>("delete_reminder", { id });
  },

  async dismissReminder(id: string): Promise<void> {
    return await invoke<void>("dismiss_reminder", { id });
  },

  async ensurePermission(): Promise<boolean> {
    try {
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === "granted";
      }
      return granted;
    } catch (err) {
      console.warn("Could not check/request notification permission:", err);
      return false;
    }
  },

  async onReminderDelivered(
    callback: (reminder: DueReminder) => void
  ): Promise<() => void> {
    try {
      return await listen<DueReminder>("reminder-delivered", (event) => {
        callback(event.payload);
      });
    } catch (err) {
      console.warn("Failed to attach reminder-delivered listener:", err);
      return () => {};
    }
  },
};
