package handler

import (
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gaslink/gateway/internal/config"
)

type ProxyHandler struct {
	cfg    *config.Config
	client *http.Client
}

func NewProxyHandler(cfg *config.Config) *ProxyHandler {
	return &ProxyHandler{
		cfg: cfg,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (p *ProxyHandler) ProxyTo(targetURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		target := targetURL + c.Request.URL.Path
		if c.Request.URL.RawQuery != "" {
			target += "?" + c.Request.URL.RawQuery
		}

		req, err := http.NewRequest(c.Request.Method, target, c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to create request"})
			return
		}

		// Copy headers (skip hop-by-hop)
		for key, values := range c.Request.Header {
			lk := strings.ToLower(key)
			if lk == "connection" || lk == "keep-alive" || lk == "transfer-encoding" || lk == "upgrade" {
				continue
			}
			for _, v := range values {
				req.Header.Add(key, v)
			}
		}

		// Forward user info from JWT middleware
		if userID, exists := c.Get("user_id"); exists {
			req.Header.Set("X-User-ID", userID.(string))
		}
		if email, exists := c.Get("email"); exists {
			req.Header.Set("X-User-Email", email.(string))
		}
		if role, exists := c.Get("role"); exists {
			req.Header.Set("X-User-Role", role.(string))
		}

		resp, err := p.client.Do(req)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Service unavailable"})
			return
		}
		defer resp.Body.Close()

		// Copy response headers from backend, but SKIP CORS headers
		// (gateway handles CORS, not backend services)
		for key, values := range resp.Header {
			lk := strings.ToLower(key)
			if strings.HasPrefix(lk, "access-control-") {
				continue // skip backend CORS headers
			}
			for _, v := range values {
				c.Writer.Header().Add(key, v)
			}
		}

		c.Status(resp.StatusCode)
		io.Copy(c.Writer, resp.Body)
	}
}
