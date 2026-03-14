package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"

	"github.com/gaslink/tracker-service/internal/config"
	"github.com/gaslink/tracker-service/internal/tracker"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins
	},
}

func main() {
	cfg := config.Load()

	var db *sql.DB
	var err error
	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", cfg.DSN())
		if err == nil {
			if err = db.Ping(); err == nil {
				break
			}
		}
		log.Printf("DB retry %d/10", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("DB failed: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(10)

	log.Println("Connected to database")

	t := tracker.New(db)
	go t.Run()

	mux := http.NewServeMux()

	// WebSocket endpoint
	mux.HandleFunc("/ws/tracking", func(w http.ResponseWriter, r *http.Request) {
		// CORS headers for WebSocket upgrade
		w.Header().Set("Access-Control-Allow-Origin", "*")

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		client := &tracker.Client{
			Send: make(chan []byte, 256),
		}

		t.Register(client)

		// Writer goroutine
		go func() {
			defer conn.Close()
			for msg := range client.Send {
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					break
				}
			}
		}()

		// Reader goroutine (keep connection alive + handle close)
		go func() {
			defer func() {
				t.Unregister(client)
				conn.Close()
			}()
			conn.SetReadLimit(512)
			conn.SetReadDeadline(time.Now().Add(60 * time.Second))
			conn.SetPongHandler(func(string) error {
				conn.SetReadDeadline(time.Now().Add(60 * time.Second))
				return nil
			})
			for {
				_, _, err := conn.ReadMessage()
				if err != nil {
					break
				}
			}
		}()

		// Ping ticker
		go func() {
			ticker := time.NewTicker(30 * time.Second)
			defer ticker.Stop()
			for range ticker.C {
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			}
		}()
	})

	// Health
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"tracker-service"}`))
	})

	log.Printf("Tracker Service on :%s (WebSocket: ws://localhost:%s/ws/tracking)", cfg.Port, cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
