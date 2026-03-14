import { api } from "./client";
import { User, CreateUserRequest, UpdateUserRequest, ListResponse } from "./types";

export const usersApi = {
  getAll: (page = 1, limit = 20, search = "") => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return api.get<ListResponse<User>>(`/users?${params}`);
  },

  getById: (id: string) =>
    api.get<User>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    api.post<User>("/users", data),

  update: (id: string, data: UpdateUserRequest) =>
    api.put<User>(`/users/${id}`, data),

  delete: (id: string) =>
    api.del<{ message: string }>(`/users/${id}`),
};
