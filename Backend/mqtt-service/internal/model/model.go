package model

// DeviceTelemetry matches the JSON payload sent by IoT devices via MQTT.
// Example: {"deviceId":555,"flow":28.63,"pressure":19.95,"lat":41.3123,"lon":69.2791,"time":"2024-07-08T14:30:12Z","temperature":42.8}
type DeviceTelemetry struct {
	DeviceID    int     `json:"deviceId"`
	Flow        float64 `json:"flow"`
	Pressure    float64 `json:"pressure"`
	Lat         float64 `json:"lat"`
	Lon         float64 `json:"lon"`
	Time        string  `json:"time"`
	Temperature float64 `json:"temperature"`
}

// WSBroadcast is sent to WebSocket clients when a new telemetry message arrives.
type WSBroadcast struct {
	Type string          `json:"type"` // always "device_telemetry"
	Data DeviceTelemetry `json:"data"`
}
