import { api } from "./client";
import { DashboardStats } from "./types";

export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>("/dashboard/stats"),
};
