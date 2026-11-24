import { invoke } from "@tauri-apps/api/core";
import { ProductivityOverview } from "../types/analytics";

export const analyticsService = {
  async getProductivityOverview(): Promise<ProductivityOverview> {
    return invoke<ProductivityOverview>("get_productivity_overview");
  },
};
