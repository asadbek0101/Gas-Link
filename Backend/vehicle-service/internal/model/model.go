package model

import "time"

type Vehicle struct {
	ID          string   `json:"id"`
	Plate       string   `json:"plate"`
	Model       string   `json:"model"`
	Status      string   `json:"status"`
	DriverID    *string  `json:"driver_id,omitempty"`
	DriverName  *string  `json:"driver_name,omitempty"`
	Fuel        int      `json:"fuel"`
	Mileage     int      `json:"mileage"`
	LastService *string  `json:"last_service,omitempty"`
	Lat         *float64 `json:"lat,omitempty"`
	Lng         *float64 `json:"lng,omitempty"`
	Speed       int      `json:"speed"`
	Heading     int      `json:"heading"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateVehicleRequest struct {
	Plate      string  `json:"plate" binding:"required"`
	Model      string  `json:"model" binding:"required"`
	Status     string  `json:"status"`
	DriverName string  `json:"driver_name"`
}

type UpdateVehicleRequest struct {
	Plate      string   `json:"plate"`
	Model      string   `json:"model"`
	Status     string   `json:"status"`
	DriverName string   `json:"driver_name"`
	Fuel       *int     `json:"fuel"`
	Mileage    *int     `json:"mileage"`
	Lat        *float64 `json:"lat"`
	Lng        *float64 `json:"lng"`
	Speed      *int     `json:"speed"`
	Heading    *int     `json:"heading"`
}

type Trip struct {
	ID          string     `json:"id"`
	VehicleID   *string    `json:"vehicle_id,omitempty"`
	VehicleName string     `json:"vehicle_name"`
	DriverName  string     `json:"driver_name"`
	Route       string     `json:"route"`
	FuelUsed    string     `json:"fuel_used"`
	Status      string     `json:"status"`
	StartedAt   time.Time  `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type CreateTripRequest struct {
	VehicleName string `json:"vehicle_name" binding:"required"`
	DriverName  string `json:"driver_name" binding:"required"`
	Route       string `json:"route" binding:"required"`
	FuelUsed    string `json:"fuel_used"`
	Status      string `json:"status"`
}

type VehicleListResponse struct {
	Data  []Vehicle `json:"data"`
	Total int       `json:"total"`
	Page  int       `json:"page"`
	Limit int       `json:"limit"`
}

type TripListResponse struct {
	Data  []Trip `json:"data"`
	Total int    `json:"total"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
}

type DashboardStats struct {
	TotalVehicles   int     `json:"total_vehicles"`
	OnRoute         int     `json:"on_route"`
	FuelConsumption string  `json:"fuel_consumption"`
	TodayMileage    string  `json:"today_mileage"`
}
