package main

import (
	"database/sql"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	"github.com/gaslink/auth-service/internal/config"
	"github.com/gaslink/auth-service/internal/handler"
	"github.com/gaslink/auth-service/internal/repository"
	"github.com/gaslink/auth-service/internal/service"
)

func main() {
	cfg := config.Load()

	// Connect to database with retry
	var db *sql.DB
	var err error
	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", cfg.DSN())
		if err == nil {
			err = db.Ping()
			if err == nil {
				break
			}
		}
		log.Printf("Waiting for database... attempt %d/10", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	log.Println("Connected to database successfully")

	// Init layers
	repo := repository.NewAuthRepository(db)
	svc := service.NewAuthService(repo, cfg)
	h := handler.NewAuthHandler(svc)

	// Setup Gin
	r := gin.Default()
	r.Use(corsMiddleware())
	h.RegisterRoutes(r)

	log.Printf("Auth Service starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
