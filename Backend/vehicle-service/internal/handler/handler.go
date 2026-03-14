package handler

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/gaslink/vehicle-service/internal/model"
	"github.com/gaslink/vehicle-service/internal/repository"
)

type VehicleHandler struct{ repo *repository.VehicleRepository }

func NewVehicleHandler(repo *repository.VehicleRepository) *VehicleHandler {
	return &VehicleHandler{repo: repo}
}

func (h *VehicleHandler) RegisterRoutes(r *gin.Engine) {
	v := r.Group("/api/v1/vehicles")
	v.GET("", h.GetAll)
	v.GET("/:id", h.GetByID)
	v.POST("", h.Create)
	v.PUT("/:id", h.Update)
	v.DELETE("/:id", h.Delete)

	t := r.Group("/api/v1/trips")
	t.GET("", h.GetTrips)
	t.POST("", h.CreateTrip)

	r.GET("/api/v1/dashboard/stats", h.GetStats)
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok", "service": "vehicle-service"}) })
}

func (h *VehicleHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 { page = 1 }; if limit < 1 || limit > 100 { limit = 20 }
	list, total, err := h.repo.GetAllVehicles(page, limit, c.Query("search"))
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	if list == nil { list = []model.Vehicle{} }
	c.JSON(200, model.VehicleListResponse{Data: list, Total: total, Page: page, Limit: limit})
}

func (h *VehicleHandler) GetByID(c *gin.Context) {
	v, err := h.repo.GetVehicleByID(c.Param("id"))
	if err != nil { c.JSON(404, gin.H{"error": "not found"}); return }
	c.JSON(200, v)
}

func (h *VehicleHandler) Create(c *gin.Context) {
	var req model.CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
	v, err := h.repo.CreateVehicle(&req)
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(201, v)
}

func (h *VehicleHandler) Update(c *gin.Context) {
	var req model.UpdateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
	v, err := h.repo.UpdateVehicle(c.Param("id"), &req)
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(200, v)
}

func (h *VehicleHandler) Delete(c *gin.Context) {
	if err := h.repo.DeleteVehicle(c.Param("id")); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(200, gin.H{"message": "deleted"})
}

func (h *VehicleHandler) GetTrips(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 { page = 1 }; if limit < 1 { limit = 20 }
	list, total, err := h.repo.GetAllTrips(page, limit)
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	if list == nil { list = []model.Trip{} }
	c.JSON(200, model.TripListResponse{Data: list, Total: total, Page: page, Limit: limit})
}

func (h *VehicleHandler) CreateTrip(c *gin.Context) {
	var req model.CreateTripRequest
	if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
	t, err := h.repo.CreateTrip(&req)
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusCreated, t)
}

func (h *VehicleHandler) GetStats(c *gin.Context) {
	s, err := h.repo.GetDashboardStats()
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	c.JSON(200, s)
}
