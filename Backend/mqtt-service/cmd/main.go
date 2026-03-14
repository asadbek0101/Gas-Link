package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"

	"github.com/gaslink/mqtt-service/internal/config"
	"github.com/gaslink/mqtt-service/internal/service"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func main() {
	cfg := config.Load()

	// ── Database ──────────────────────────────────────────────────
	var db *sql.DB
	var err error
	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", cfg.DSN())
		if err == nil {
			if err = db.Ping(); err == nil {
				break
			}
		}
		log.Printf("[DB] Retry %d/10 ...", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("[DB] Failed to connect: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(10)
	log.Println("[DB] Connected")

	// ── WebSocket Hub ─────────────────────────────────────────────
	hub := service.NewHub()
	go hub.Run()

	// ── MQTT Service ──────────────────────────────────────────────
	mqttSvc := service.New(cfg, db, hub)
	if err := mqttSvc.Connect(); err != nil {
		// Non-fatal: log the error but keep running so WebSocket still works.
		// Reconnection is handled by the MQTT client automatically once the
		// broker becomes reachable.
		log.Printf("[MQTT] Initial connection failed: %v (will retry in background)", err)
	}

	// ── HTTP / WebSocket Server ───────────────────────────────────
	mux := http.NewServeMux()

	// WebSocket endpoint — frontend connects here
	mux.HandleFunc("/ws/telemetry", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("[WS] Upgrade error: %v", err)
			return
		}

		client := &service.Client{Send: make(chan []byte, 256)}
		hub.Register(client)

		// Writer goroutine — sends messages from channel to WebSocket
		go func() {
			defer conn.Close()
			for msg := range client.Send {
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					break
				}
			}
		}()

		// Ping ticker — keeps connection alive
		go func() {
			ticker := time.NewTicker(30 * time.Second)
			defer ticker.Stop()
			for range ticker.C {
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			}
		}()

		// Reader goroutine — detects close and pong
		defer func() {
			hub.Unregister(client)
			conn.Close()
		}()
		conn.SetReadLimit(512)
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		conn.SetPongHandler(func(string) error {
			conn.SetReadDeadline(time.Now().Add(60 * time.Second))
			return nil
		})
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	})

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"mqtt-service"}`))
	})

	addr := ":" + cfg.Port
	log.Printf("[HTTP] MQTT Service listening on %s | WS: ws://localhost%s/ws/telemetry", addr, addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("[HTTP] Server failed: %v", err)
	}
}
