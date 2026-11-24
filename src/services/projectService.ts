import { invoke } from "@tauri-apps/api/core";
import { CreateProjectInput, Project, UpdateProjectInput } from "../types/project";

export const projectService = {
  createProject: async (input: CreateProjectInput): Promise<Project> => {
    return await invoke<Project>("create_project", { input });
  },

  getProject: async (id: string): Promise<Project> => {
    return await invoke<Project>("get_project", { id });
  },

  listProjects: async (includeArchived?: boolean): Promise<Project[]> => {
    return await invoke<Project[]>("list_projects", { includeArchived });
  },

  updateProject: async (id: string, input: UpdateProjectInput): Promise<Project> => {
    return await invoke<Project>("update_project", { id, input });
  },

  deleteProject: async (id: string): Promise<void> => {
    return await invoke<void>("delete_project", { id });
  },
};
