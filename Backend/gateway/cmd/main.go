package main

import (
	"embed"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/gaslink/gateway/internal/config"
	"github.com/gaslink/gateway/internal/handler"
	"github.com/gaslink/gateway/internal/middleware"
)

//go:embed swagger.json
var swaggerJSON embed.FS

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func main() {
	cfg := config.Load()
	proxy := handler.NewProxyHandler(cfg)

	r := gin.Default()
	r.Use(corsMiddleware())

	// Catch-all OPTIONS
	r.OPTIONS("/*path", func(c *gin.Context) {
		c.AbortWithStatus(http.StatusNoContent)
	})

	// ============ WebSocket Proxy — /ws/tracking ============
	r.GET("/ws/tracking", func(c *gin.Context) {
		proxyWebSocket(c.Writer, c.Request, cfg.TrackerServiceURL)
	})

	// ============ WebSocket Proxy — /ws/telemetry (MQTT device data) ============
	r.GET("/ws/telemetry", func(c *gin.Context) {
		proxyWebSocket(c.Writer, c.Request, cfg.MQTTServiceURL)
	})

	// ============ Swagger UI ============
	r.GET("/swagger/*any", func(c *gin.Context) {
		if c.Param("any") == "/swagger.json" || c.Param("any") == "/doc.json" {
			data, _ := swaggerJSON.ReadFile("swagger.json")
			c.Data(200, "application/json", data)
			return
		}
		c.Data(200, "text/html", []byte(swaggerHTML))
	})

	// ============ Health ============
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok", "service": "api-gateway",
			"services": gin.H{
				"auth": cfg.AuthServiceURL, "users": cfg.UserServiceURL,
				"drivers": cfg.DriverServiceURL, "vehicles": cfg.VehicleServiceURL,
				"notifications": cfg.NotificationServiceURL, "tracker": cfg.TrackerServiceURL,
			},
		})
	})

	// ============ Public Routes ============
	r.POST("/api/v1/auth/login", proxy.ProxyTo(cfg.AuthServiceURL))
	r.POST("/api/v1/auth/register", proxy.ProxyTo(cfg.AuthServiceURL))
	r.GET("/api/v1/auth/health", proxy.ProxyTo(cfg.AuthServiceURL))

	// ============ Protected Routes ============
	protected := r.Group("/api/v1")
	protected.Use(middleware.JWTAuth(cfg.JWTSecret))
	{
		protected.POST("/auth/validate", proxy.ProxyTo(cfg.AuthServiceURL))

		protected.GET("/users", proxy.ProxyTo(cfg.UserServiceURL))
		protected.GET("/users/:id", proxy.ProxyTo(cfg.UserServiceURL))
		protected.POST("/users", middleware.RoleRequired("admin"), proxy.ProxyTo(cfg.UserServiceURL))
		protected.PUT("/users/:id", middleware.RoleRequired("admin", "manager"), proxy.ProxyTo(cfg.UserServiceURL))
		protected.DELETE("/users/:id", middleware.RoleRequired("admin"), proxy.ProxyTo(cfg.UserServiceURL))

		protected.GET("/drivers", proxy.ProxyTo(cfg.DriverServiceURL))
		protected.GET("/drivers/:id", proxy.ProxyTo(cfg.DriverServiceURL))
		protected.POST("/drivers", proxy.ProxyTo(cfg.DriverServiceURL))
		protected.PUT("/drivers/:id", proxy.ProxyTo(cfg.DriverServiceURL))
		protected.DELETE("/drivers/:id", middleware.RoleRequired("admin", "manager"), proxy.ProxyTo(cfg.DriverServiceURL))

		protected.GET("/vehicles", proxy.ProxyTo(cfg.VehicleServiceURL))
		protected.GET("/vehicles/:id", proxy.ProxyTo(cfg.VehicleServiceURL))
		protected.POST("/vehicles", proxy.ProxyTo(cfg.VehicleServiceURL))
		protected.PUT("/vehicles/:id", proxy.ProxyTo(cfg.VehicleServiceURL))
		protected.DELETE("/vehicles/:id", middleware.RoleRequired("admin", "manager"), proxy.ProxyTo(cfg.VehicleServiceURL))

		protected.GET("/trips", proxy.ProxyTo(cfg.VehicleServiceURL))
		protected.POST("/trips", proxy.ProxyTo(cfg.VehicleServiceURL))
		protected.GET("/dashboard/stats", proxy.ProxyTo(cfg.VehicleServiceURL))

		protected.GET("/notifications", proxy.ProxyTo(cfg.NotificationServiceURL))
		protected.POST("/notifications", proxy.ProxyTo(cfg.NotificationServiceURL))
		protected.PUT("/notifications/:id/read", proxy.ProxyTo(cfg.NotificationServiceURL))
		protected.PUT("/notifications/read-all", proxy.ProxyTo(cfg.NotificationServiceURL))
		protected.DELETE("/notifications/:id", proxy.ProxyTo(cfg.NotificationServiceURL))
	}

	log.Printf("GasLink API Gateway on :%s | Swagger: http://localhost:%s/swagger/", cfg.Port, cfg.Port)
	r.Run(":" + cfg.Port)
}

// proxyWebSocket proxies a WebSocket connection to the backend tracker service
func proxyWebSocket(w http.ResponseWriter, r *http.Request, targetBaseURL string) {
	// Parse target URL and convert to ws://
	targetURL, _ := url.Parse(targetBaseURL)
	targetURL.Scheme = "ws"
	if strings.HasPrefix(targetBaseURL, "https") {
		targetURL.Scheme = "wss"
	}
	targetURL.Path = r.URL.Path

	// Connect to backend WebSocket
	backendConn, _, err := websocket.DefaultDialer.Dial(targetURL.String(), nil)
	if err != nil {
		log.Printf("Backend WS dial error: %v", err)
		http.Error(w, "Backend unavailable", http.StatusBadGateway)
		return
	}
	defer backendConn.Close()

	// Upgrade client connection
	clientConn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Client WS upgrade error: %v", err)
		return
	}
	defer clientConn.Close()

	done := make(chan struct{})

	// Backend -> Client
	go func() {
		defer close(done)
		for {
			msgType, msg, err := backendConn.ReadMessage()
			if err != nil {
				return
			}
			if err := clientConn.WriteMessage(msgType, msg); err != nil {
				return
			}
		}
	}()

	// Client -> Backend
	go func() {
		for {
			msgType, msg, err := clientConn.ReadMessage()
			if err != nil {
				return
			}
			if err := backendConn.WriteMessage(msgType, msg); err != nil {
				return
			}
		}
	}()

	<-done
	// Properly close with close message
	_ = clientConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	_ = backendConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept, Accept-Encoding, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}


const swaggerHTML = `<!DOCTYPE html>
<html><head><title>GasLink API - Swagger</title><meta charset="utf-8"/>
<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
<style>body{margin:0;background:#fafafa}.topbar{display:none}.swagger-ui .info .title{color:#1E3A5F}</style>
</head><body><div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({url:"/swagger/swagger.json",dom_id:'#swagger-ui',presets:[SwaggerUIBundle.presets.apis,SwaggerUIBundle.SwaggerUIStandalonePreset],layout:"StandaloneLayout",deepLinking:true,persistAuthorization:true});</script>
</body></html>`
