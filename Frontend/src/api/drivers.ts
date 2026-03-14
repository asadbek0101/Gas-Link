import { api } from "./client";
import { Driver, CreateDriverRequest, UpdateDriverRequest, ListResponse } from "./types";

export const driversApi = {
  getAll: (page = 1, limit = 20, search = "") => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return api.get<ListResponse<Driver>>(`/drivers?${params}`);
  },

  getById: (id: string) =>
    api.get<Driver>(`/drivers/${id}`),

  create: (data: CreateDriverRequest) =>
    api.post<Driver>("/drivers", data),

  update: (id: string, data: UpdateDriverRequest) =>
    api.put<Driver>(`/drivers/${id}`, data),

  delete: (id: string) =>
    api.del<{ message: string }>(`/drivers/${id}`),
};
