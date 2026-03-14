package repository

import (
	"database/sql"
	"github.com/gaslink/notification-service/internal/model"
)

type NotificationRepository struct{ db *sql.DB }

func NewNotificationRepository(db *sql.DB) *NotificationRepository { return &NotificationRepository{db: db} }

func (r *NotificationRepository) GetAll() ([]model.Notification, int, error) {
	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM notifications").Scan(&total)
	rows, err := r.db.Query("SELECT id,type,title,message,is_read,created_at FROM notifications ORDER BY created_at DESC LIMIT 50")
	if err != nil { return nil, 0, err }
	defer rows.Close()
	var list []model.Notification
	for rows.Next() {
		var n model.Notification
		rows.Scan(&n.ID, &n.Type, &n.Title, &n.Message, &n.IsRead, &n.CreatedAt)
		list = append(list, n)
	}
	return list, total, nil
}

func (r *NotificationRepository) Create(req *model.CreateNotificationRequest) (*model.Notification, error) {
	n := &model.Notification{}
	err := r.db.QueryRow(
		"INSERT INTO notifications (type,title,message) VALUES ($1,$2,$3) RETURNING id,type,title,message,is_read,created_at",
		req.Type, req.Title, req.Message,
	).Scan(&n.ID, &n.Type, &n.Title, &n.Message, &n.IsRead, &n.CreatedAt)
	return n, err
}

func (r *NotificationRepository) MarkAsRead(id string) error {
	_, err := r.db.Exec("UPDATE notifications SET is_read=true WHERE id=$1", id)
	return err
}

func (r *NotificationRepository) MarkAllAsRead() error {
	_, err := r.db.Exec("UPDATE notifications SET is_read=true WHERE is_read=false")
	return err
}

func (r *NotificationRepository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM notifications WHERE id=$1", id)
	return err
}
