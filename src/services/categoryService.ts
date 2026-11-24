import { invoke } from "@tauri-apps/api/core";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "../types/category";

export const categoryService = {
  createCategory: async (input: CreateCategoryInput): Promise<Category> => {
    return await invoke<Category>("create_category", { input });
  },

  getCategory: async (id: string): Promise<Category> => {
    return await invoke<Category>("get_category", { id });
  },

  listCategories: async (): Promise<Category[]> => {
    return await invoke<Category[]>("list_categories");
  },

  updateCategory: async (id: string, input: UpdateCategoryInput): Promise<Category> => {
    return await invoke<Category>("update_category", { id, input });
  },

  deleteCategory: async (id: string): Promise<void> => {
    return await invoke<void>("delete_category", { id });
  },
};
