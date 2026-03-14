import { api } from "./client";
import { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, ListResponse } from "./types";

export const vehiclesApi = {
  getAll: (page = 1, limit = 20, search = "") => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return api.get<ListResponse<Vehicle>>(`/vehicles?${params}`);
  },

  getById: (id: string) =>
    api.get<Vehicle>(`/vehicles/${id}`),

  create: (data: CreateVehicleRequest) =>
    api.post<Vehicle>("/vehicles", data),

  update: (id: string, data: UpdateVehicleRequest) =>
    api.put<Vehicle>(`/vehicles/${id}`, data),

  delete: (id: string) =>
    api.del<{ message: string }>(`/vehicles/${id}`),
};
