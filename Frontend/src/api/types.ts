// ==================== Auth ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TokenClaims {
  user_id: string;
  email: string;
  role: string;
}

// ==================== User ====================
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
  status?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

// ==================== Driver ====================
export interface Driver {
  id: string;
  name: string;
  phone: string;
  experience: string;
  rating: number;
  trips: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDriverRequest {
  name: string;
  phone: string;
  experience: string;
  status?: string;
}

export interface UpdateDriverRequest {
  name?: string;
  phone?: string;
  experience?: string;
  status?: string;
}

// ==================== Vehicle ====================
export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: string;
  driver_id?: string;
  driver_name?: string;
  fuel: number;
  mileage: number;
  last_service?: string;
  lat?: number;
  lng?: number;
  speed: number;
  heading: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleRequest {
  plate: string;
  model: string;
  driver_name?: string;
  status?: string;
}

export interface UpdateVehicleRequest {
  plate?: string;
  model?: string;
  status?: string;
  driver_name?: string;
}

// ==================== Trip ====================
export interface Trip {
  id: string;
  vehicle_id?: string;
  vehicle_name: string;
  driver_name: string;
  route: string;
  fuel_used: string;
  status: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface CreateTripRequest {
  vehicle_name: string;
  driver_name: string;
  route: string;
  fuel_used?: string;
  status?: string;
}

// ==================== Notification ====================
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationRequest {
  type: string;
  title: string;
  message: string;
}

// ==================== Dashboard ====================
export interface DashboardStats {
  total_vehicles: number;
  on_route: number;
  fuel_consumption: string;
  today_mileage: string;
}

// ==================== List Responses ====================
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
}
