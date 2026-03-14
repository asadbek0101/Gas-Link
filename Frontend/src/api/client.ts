const API_BASE_URL = "/api/v1";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem("gaslink_token");
  }

  private getHeaders(withAuth = true): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    if (withAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      auth?: boolean;
    } = {}
  ): Promise<T> {
    const { method = "GET", body, auth = true } = options;

    const config: RequestInit = {
      method,
      headers: this.getHeaders(auth),
      mode: "cors",
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (response.status === 401) {
      localStorage.removeItem("gaslink_token");
      localStorage.removeItem("gaslink_user");
      window.location.reload();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, auth = true) {
    return this.request<T>(endpoint, { method: "GET", auth });
  }

  post<T>(endpoint: string, body: unknown, auth = true) {
    return this.request<T>(endpoint, { method: "POST", body, auth });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  del<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);
export { API_BASE_URL };
