package main
import (
	"database/sql"; "log"; "time"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/gaslink/notification-service/internal/config"
	"github.com/gaslink/notification-service/internal/handler"
	"github.com/gaslink/notification-service/internal/repository"
)
func main() {
	cfg := config.Load()
	var db *sql.DB; var err error
	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", cfg.DSN())
		if err == nil { if err = db.Ping(); err == nil { break } }
		log.Printf("DB retry %d/10", i+1); time.Sleep(2 * time.Second)
	}
	if err != nil { log.Fatalf("DB failed: %v", err) }
	defer db.Close()
	r := gin.Default(); r.Use(cors())
	handler.NewNotificationHandler(repository.NewNotificationRepository(db)).RegisterRoutes(r)
	log.Printf("Notification Service on :%s", cfg.Port)
	r.Run(":" + cfg.Port)
}
func cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if c.Request.Method == "OPTIONS" { c.AbortWithStatus(204); return }
		c.Next()
	}
}
