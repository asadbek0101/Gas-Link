package model

import "time"

type Driver struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Phone      string    `json:"phone"`
	Experience string    `json:"experience"`
	Rating     float64   `json:"rating"`
	Trips      int       `json:"trips"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type CreateDriverRequest struct {
	Name       string `json:"name" binding:"required"`
	Phone      string `json:"phone" binding:"required"`
	Experience string `json:"experience" binding:"required"`
	Status     string `json:"status"`
}

type UpdateDriverRequest struct {
	Name       string  `json:"name"`
	Phone      string  `json:"phone"`
	Experience string  `json:"experience"`
	Rating     float64 `json:"rating"`
	Trips      int     `json:"trips"`
	Status     string  `json:"status"`
}

type ListResponse struct {
	Data  []Driver `json:"data"`
	Total int      `json:"total"`
	Page  int      `json:"page"`
	Limit int      `json:"limit"`
}
