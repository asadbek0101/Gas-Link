package service

import (
	"database/sql"
	"encoding/json"
	"log"
	"math"
	"sync"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gaslink/mqtt-service/internal/config"
	"github.com/gaslink/mqtt-service/internal/model"
)

// Client represents a single WebSocket subscriber.
type Client struct {
	Send chan []byte
}

// Hub manages all connected WebSocket clients.
type Hub struct {
	mu         sync.RWMutex
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte, 512),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c] = true
			h.mu.Unlock()
			log.Printf("[WS] Client connected. Total: %d", len(h.clients))

		case c := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				close(c.Send)
			}
			h.mu.Unlock()
			log.Printf("[WS] Client disconnected. Total: %d", len(h.clients))

		case msg := <-h.broadcast:
			h.mu.RLock()
			for c := range h.clients {
				select {
				case c.Send <- msg:
				default:
					close(c.Send)
					delete(h.clients, c)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) Register(c *Client)   { h.register <- c }
func (h *Hub) Unregister(c *Client) { h.unregister <- c }
func (h *Hub) Broadcast(msg []byte) { h.broadcast <- msg }

// ── MQTTService ───────────────────────────────────────────────────────────────

type MQTTService struct {
	cfg  *config.Config
	db   *sql.DB
	hub  *Hub
	mqtt mqtt.Client
}

func New(cfg *config.Config, db *sql.DB, hub *Hub) *MQTTService {
	return &MQTTService{cfg: cfg, db: db, hub: hub}
}

func (s *MQTTService) Connect() error {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(s.cfg.MQTTBroker)
	opts.SetClientID(s.cfg.MQTTClientID)
	opts.SetAutoReconnect(true)
	opts.SetCleanSession(false)

	if s.cfg.MQTTUsername != "" {
		opts.SetUsername(s.cfg.MQTTUsername)
		opts.SetPassword(s.cfg.MQTTPassword)
	}

	opts.SetOnConnectHandler(func(c mqtt.Client) {
		log.Printf("[MQTT] Connected to broker: %s", s.cfg.MQTTBroker)
		s.subscribe(c)
	})
	opts.SetConnectionLostHandler(func(c mqtt.Client, err error) {
		log.Printf("[MQTT] Connection lost: %v — will auto-reconnect", err)
	})

	client := mqtt.NewClient(opts)
	token := client.Connect()
	token.Wait()
	if err := token.Error(); err != nil {
		return err
	}
	s.mqtt = client
	return nil
}

func (s *MQTTService) subscribe(c mqtt.Client) {
	token := c.Subscribe(s.cfg.MQTTTopic, 1, s.handleMessage)
	token.Wait()
	if err := token.Error(); err != nil {
		log.Printf("[MQTT] Subscribe error: %v", err)
	} else {
		log.Printf("[MQTT] Subscribed to topic: %s", s.cfg.MQTTTopic)
	}
}

func (s *MQTTService) handleMessage(_ mqtt.Client, msg mqtt.Message) {
	log.Printf("[MQTT] Topic=%s Payload=%s", msg.Topic(), string(msg.Payload()))

	var t model.DeviceTelemetry
	if err := json.Unmarshal(msg.Payload(), &t); err != nil {
		log.Printf("[MQTT] JSON parse error: %v", err)
		return
	}

	// 1. Save raw telemetry row
	if err := s.saveTelemetry(t); err != nil {
		log.Printf("[MQTT] telemetry insert error: %v", err)
	}

	// 2. Update the matching vehicle row so tracker-service sees fresh data.
	//    Speed is derived from flow (m³/h) converted to a display value.
	//    Heading is computed from the lat/lon delta stored in telemetry.
	if err := s.updateVehicle(t); err != nil {
		log.Printf("[MQTT] vehicle update error: %v", err)
	}

	// 3. Broadcast raw telemetry to WebSocket clients (MapPage telemetry panel)
	broadcast := model.WSBroadcast{Type: "device_telemetry", Data: t}
	data, _ := json.Marshal(broadcast)
	s.hub.Broadcast(data)
}

// saveTelemetry inserts a raw row into device_telemetry.
func (s *MQTTService) saveTelemetry(t model.DeviceTelemetry) error {
	_, err := s.db.Exec(
		`INSERT INTO device_telemetry (device_id, flow, pressure, lat, lon, temperature, device_time)
		 VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)`,
		t.DeviceID, t.Flow, t.Pressure, t.Lat, t.Lon, t.Temperature, t.Time,
	)
	return err
}

// updateVehicle updates the vehicle whose device_id matches.
// It updates lat, lng, speed (derived from flow), heading (from movement direction),
// and updated_at — which is what tracker-service uses to decide connection status.
func (s *MQTTService) updateVehicle(t model.DeviceTelemetry) error {
	// Fetch the previous position so we can compute heading
	var prevLat, prevLng float64
	err := s.db.QueryRow(
		`SELECT COALESCE(lat,0), COALESCE(lng,0) FROM vehicles WHERE device_id = $1`,
		t.DeviceID,
	).Scan(&prevLat, &prevLng)

	heading := 0
	if err == nil && (prevLat != 0 || prevLng != 0) {
		dLat := t.Lat - prevLat
		dLon := t.Lon - prevLng
		heading = int(math.Atan2(dLon, dLat)*180/math.Pi)
		if heading < 0 {
			heading += 360
		}
	}

	// Convert flow (m³/h) to an approximate km/h display speed.
	// Pure heuristic — replace with your own formula if needed.
	speed := int(t.Flow * 2)

	_, err = s.db.Exec(`
		UPDATE vehicles
		SET
			lat        = $1,
			lng        = $2,
			speed      = $3,
			heading    = $4,
			updated_at = NOW()
		WHERE device_id = $5`,
		t.Lat, t.Lon, speed, heading, t.DeviceID,
	)
	return err
}
