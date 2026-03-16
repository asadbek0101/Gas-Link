package config

import "os"

type Config struct {
	Port                   string
	AuthServiceURL         string
	UserServiceURL         string
	DriverServiceURL       string
	VehicleServiceURL      string
	NotificationServiceURL string
	TrackerServiceURL      string
	MQTTServiceURL         string
	FrontendURL            string
	JWTSecret              string
}

func Load() *Config {
	return &Config{
		Port:                   ge("GATEWAY_PORT", "8080"),
		AuthServiceURL:         ge("AUTH_SERVICE_URL", "http://localhost:8081"),
		UserServiceURL:         ge("USER_SERVICE_URL", "http://localhost:8082"),
		DriverServiceURL:       ge("DRIVER_SERVICE_URL", "http://localhost:8083"),
		VehicleServiceURL:      ge("VEHICLE_SERVICE_URL", "http://localhost:8084"),
		NotificationServiceURL: ge("NOTIFICATION_SERVICE_URL", "http://localhost:8085"),
		TrackerServiceURL:      ge("TRACKER_SERVICE_URL", "http://localhost:8086"),
		MQTTServiceURL:         ge("MQTT_SERVICE_URL", "http://localhost:8087"),
		FrontendURL:            ge("FRONTEND_URL", "http://frontend:3000"),
		JWTSecret:              ge("JWT_SECRET", "gaslink-jwt-super-secret-key-2024"),
	}
}

func ge(k, f string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return f
}