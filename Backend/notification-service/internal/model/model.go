package model
import "time"

type Notification struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateNotificationRequest struct {
	Type    string `json:"type" binding:"required"`
	Title   string `json:"title" binding:"required"`
	Message string `json:"message" binding:"required"`
}

type ListResponse struct {
	Data  []Notification `json:"data"`
	Total int            `json:"total"`
}
