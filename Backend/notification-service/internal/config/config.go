package config
import ("fmt"; "os")
type Config struct { DBHost, DBPort, DBUser, DBPassword, DBName, DBSSLMode, Port string }
func Load() *Config {
	return &Config{DBHost: ge("DB_HOST","localhost"),DBPort: ge("DB_PORT","5432"),DBUser: ge("DB_USER","gaslink"),DBPassword: ge("DB_PASSWORD","gaslink_secret_2024"),DBName: ge("DB_NAME","gaslink_db"),DBSSLMode: ge("DB_SSLMODE","disable"),Port: ge("SERVICE_PORT","8085")}
}
func (c *Config) DSN() string { return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode) }
func ge(k, f string) string { if v := os.Getenv(k); v != "" { return v }; return f }
