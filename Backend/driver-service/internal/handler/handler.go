package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gaslink/driver-service/internal/model"
	"github.com/gaslink/driver-service/internal/repository"
)

type DriverHandler struct{ repo *repository.DriverRepository }

func NewDriverHandler(repo *repository.DriverRepository) *DriverHandler {
	return &DriverHandler{repo: repo}
}

func (h *DriverHandler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1/drivers")
	api.GET("", h.GetAll)
	api.GET("/:id", h.GetByID)
	api.POST("", h.Create)
	api.PUT("/:id", h.Update)
	api.DELETE("/:id", h.Delete)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "driver-service"})
	})
}

func (h *DriverHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	list, total, err := h.repo.GetAll(page, limit, c.Query("search"))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if list == nil {
		list = []model.Driver{}
	}
	c.JSON(200, model.ListResponse{Data: list, Total: total, Page: page, Limit: limit})
}

func (h *DriverHandler) GetByID(c *gin.Context) {
	d, err := h.repo.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	c.JSON(200, d)
}

func (h *DriverHandler) Create(c *gin.Context) {
	var req model.CreateDriverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	d, err := h.repo.Create(&req)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, d)
}

func (h *DriverHandler) Update(c *gin.Context) {
	var req model.UpdateDriverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	d, err := h.repo.Update(c.Param("id"), &req)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, d)
}

func (h *DriverHandler) Delete(c *gin.Context) {
	if err := h.repo.Delete(c.Param("id")); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "deleted"})
}
