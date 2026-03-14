package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	Port       string
	// MQTT broker address, e.g. tcp://192.168.1.100:1883
	MQTTBroker   string
	MQTTTopic    string
	MQTTClientID string
	MQTTUsername string
	MQTTPassword string
}

func Load() *Config {
	return &Config{
		DBHost:       ge("DB_HOST", "localhost"),
		DBPort:       ge("DB_PORT", "5432"),
		DBUser:       ge("DB_USER", "gaslink"),
		DBPassword:   ge("DB_PASSWORD", "gaslink_secret_2024"),
		DBName:       ge("DB_NAME", "gaslink_db"),
		DBSSLMode:    ge("DB_SSLMODE", "disable"),
		Port:         ge("SERVICE_PORT", "8087"),
		MQTTBroker:   ge("MQTT_BROKER", "tcp://localhost:1883"),
		MQTTTopic:    ge("MQTT_TOPIC", "devices/#"),
		MQTTClientID: ge("MQTT_CLIENT_ID", "gaslink-mqtt-service"),
		MQTTUsername: ge("MQTT_USERNAME", ""),
		MQTTPassword: ge("MQTT_PASSWORD", ""),
	}
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

func ge(k, fallback string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return fallback
}
