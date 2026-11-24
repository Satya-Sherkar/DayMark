import { invoke } from "@tauri-apps/api/core";
import { CreateTaskInput, DashboardSummary, Task, TaskFilters, UpdateTaskInput } from "../types/task";

export const taskService = {
  createTask: async (input: CreateTaskInput): Promise<Task> => {
    return await invoke<Task>("create_task", { input });
  },

  getTask: async (id: string): Promise<Task> => {
    return await invoke<Task>("get_task", { id });
  },

  listTasks: async (filters?: TaskFilters): Promise<Task[]> => {
    return await invoke<Task[]>("list_tasks", { filters });
  },

  updateTask: async (id: string, input: UpdateTaskInput): Promise<Task> => {
    return await invoke<Task>("update_task", { id, input });
  },

  completeTask: async (id: string): Promise<Task> => {
    return await invoke<Task>("complete_task", { id });
  },

  reopenTask: async (id: string): Promise<Task> => {
    return await invoke<Task>("reopen_task", { id });
  },

  deleteTask: async (id: string): Promise<void> => {
    return await invoke<void>("delete_task", { id });
  },

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    return await invoke<DashboardSummary>("get_dashboard_summary");
  },
};
