package config

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	JWTSecret  string
	JWTExpiry  time.Duration
	Port       string
}

func Load() *Config {
	expiry, _ := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "gaslink"),
		DBPassword: getEnv("DB_PASSWORD", "gaslink_secret_2024"),
		DBName:     getEnv("DB_NAME", "gaslink_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		JWTSecret:  getEnv("JWT_SECRET", "gaslink-jwt-super-secret-key-2024"),
		JWTExpiry:  expiry,
		Port:       getEnv("SERVICE_PORT", "8081"),
	}
}

func (c *Config) DSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
