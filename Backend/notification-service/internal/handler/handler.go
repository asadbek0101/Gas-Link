package handler

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/gaslink/notification-service/internal/model"
	"github.com/gaslink/notification-service/internal/repository"
)

type NotificationHandler struct{ repo *repository.NotificationRepository }

func NewNotificationHandler(repo *repository.NotificationRepository) *NotificationHandler {
	return &NotificationHandler{repo: repo}
}

func (h *NotificationHandler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1/notifications")
	api.GET("", h.GetAll)
	api.POST("", h.Create)
	api.PUT("/:id/read", h.MarkAsRead)
	api.PUT("/read-all", h.MarkAllAsRead)
	api.DELETE("/:id", h.Delete)
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok", "service": "notification-service"}) })
}

func (h *NotificationHandler) GetAll(c *gin.Context) {
	list, total, err := h.repo.GetAll()
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	if list == nil { list = []model.Notification{} }
	c.JSON(200, model.ListResponse{Data: list, Total: total})
}

func (h *NotificationHandler) Create(c *gin.Context) {
	var req model.CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
	n, err := h.repo.Create(&req)
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusCreated, n)
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	if err := h.repo.MarkAsRead(c.Param("id")); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(200, gin.H{"message": "marked as read"})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	if err := h.repo.MarkAllAsRead(); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(200, gin.H{"message": "all marked as read"})
}

func (h *NotificationHandler) Delete(c *gin.Context) {
	if err := h.repo.Delete(c.Param("id")); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(200, gin.H{"message": "deleted"})
}
