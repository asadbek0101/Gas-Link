package tracker

import (
	"database/sql"
	"encoding/json"
	"log"
	"sync"
	"time"
)

// ConnectionStatus is computed from how recently a device sent MQTT data.
// It overrides the raw DB status field so the frontend always reflects reality.
//   - "active"  → MQTT message received within the last 30 s
//   - "stopped" → last MQTT message was 30 s – 5 min ago
//   - "offline" → no MQTT message for > 5 min (or never received)
const (
	thresholdActive  = 30 * time.Second
	thresholdStopped = 5 * time.Minute
)

type VehiclePosition struct {
	ID               string  `json:"id"`
	Plate            string  `json:"plate"`
	Status           string  `json:"status"`          // computed from last MQTT time
	DriverName       *string `json:"driver_name"`
	Lat              float64 `json:"lat"`
	Lng              float64 `json:"lng"`
	Speed            int     `json:"speed"`
	Heading          int     `json:"heading"`
	Fuel             int     `json:"fuel"`
	LastSeenSeconds  int     `json:"last_seen_seconds"` // seconds since last MQTT
}

type BroadcastMessage struct {
	Type     string            `json:"type"`
	Vehicles []VehiclePosition `json:"vehicles"`
	Time     string            `json:"time"`
}

type Tracker struct {
	db         *sql.DB
	clients    map[*Client]bool
	mu         sync.RWMutex
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

type Client struct {
	Send chan []byte
}

func New(db *sql.DB) *Tracker {
	return &Tracker{
		db:         db,
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (t *Tracker) Register(c *Client)   { t.register <- c }
func (t *Tracker) Unregister(c *Client) { t.unregister <- c }

func (t *Tracker) Run() {
	// Client manager goroutine
	go func() {
		for {
			select {
			case client := <-t.register:
				t.mu.Lock()
				t.clients[client] = true
				t.mu.Unlock()
				log.Printf("[Tracker] Client connected. Total: %d", len(t.clients))

			case client := <-t.unregister:
				t.mu.Lock()
				if _, ok := t.clients[client]; ok {
					delete(t.clients, client)
					close(client.Send)
				}
				t.mu.Unlock()
				log.Printf("[Tracker] Client disconnected. Total: %d", len(t.clients))

			case msg := <-t.broadcast:
				t.mu.RLock()
				for client := range t.clients {
					select {
					case client.Send <- msg:
					default:
						close(client.Send)
						delete(t.clients, client)
					}
				}
				t.mu.RUnlock()
			}
		}
	}()

	// Broadcast current vehicle states every 3 seconds
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		t.mu.RLock()
		clientCount := len(t.clients)
		t.mu.RUnlock()

		if clientCount == 0 {
			continue
		}

		vehicles, err := t.readPositions()
		if err != nil {
			log.Printf("[Tracker] DB read error: %v", err)
			continue
		}

		msg := BroadcastMessage{
			Type:     "vehicle_positions",
			Vehicles: vehicles,
			Time:     time.Now().Format(time.RFC3339),
		}

		data, err := json.Marshal(msg)
		if err != nil {
			continue
		}

		t.broadcast <- data
	}
}

// readPositions reads all vehicles from DB and computes connection status
// based on when the device last sent an MQTT message (vehicles.updated_at).
func (t *Tracker) readPositions() ([]VehiclePosition, error) {
	rows, err := t.db.Query(`
		SELECT
			id,
			plate,
			COALESCE(driver_name, ''),
			COALESCE(lat, 0),
			COALESCE(lng, 0),
			COALESCE(speed, 0),
			COALESCE(heading, 0),
			COALESCE(fuel, 0),
			updated_at
		FROM vehicles
		ORDER BY plate
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	now := time.Now()
	var vehicles []VehiclePosition

	for rows.Next() {
		var (
			v          VehiclePosition
			driverName string
			updatedAt  time.Time
		)

		if err := rows.Scan(
			&v.ID, &v.Plate, &driverName,
			&v.Lat, &v.Lng, &v.Speed, &v.Heading, &v.Fuel,
			&updatedAt,
		); err != nil {
			continue
		}

		if driverName != "" {
			v.DriverName = &driverName
		}

		// Compute how long ago this device last sent data
		elapsed := now.Sub(updatedAt)
		v.LastSeenSeconds = int(elapsed.Seconds())

		switch {
		case elapsed <= thresholdActive:
			v.Status = "active"   // green — recently heard from
		case elapsed <= thresholdStopped:
			v.Status = "stopped"  // amber — silent for a bit
		default:
			v.Status = "offline"  // gray  — no signal
		}

		// If no real position data yet (lat==0 && lng==0) treat as offline
		if v.Lat == 0 && v.Lng == 0 {
			v.Status = "offline"
		}

		vehicles = append(vehicles, v)
	}

	return vehicles, nil
}
