import { api } from "./client";
import { Trip, CreateTripRequest, ListResponse } from "./types";

export const tripsApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<ListResponse<Trip>>(`/trips?page=${page}&limit=${limit}`),

  create: (data: CreateTripRequest) =>
    api.post<Trip>("/trips", data),
};
