import { api } from "./client";
import { AuthResponse, LoginRequest, RegisterRequest, TokenClaims } from "./types";

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", data, false),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", data, false),

  validate: () =>
    api.post<TokenClaims>("/auth/validate", {}),
};

// Token helpers
export const saveAuth = (response: AuthResponse) => {
  localStorage.setItem("gaslink_token", response.token);
  localStorage.setItem("gaslink_user", JSON.stringify(response.user));
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem("gaslink_user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const getStoredToken = () => localStorage.getItem("gaslink_token");

export const clearAuth = () => {
  localStorage.removeItem("gaslink_token");
  localStorage.removeItem("gaslink_user");
};

export const isAuthenticated = () => !!getStoredToken();
