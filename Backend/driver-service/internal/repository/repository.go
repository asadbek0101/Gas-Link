package repository

import (
	"database/sql"
	"fmt"
	"time"
	"github.com/gaslink/driver-service/internal/model"
)

type DriverRepository struct{ db *sql.DB }

func NewDriverRepository(db *sql.DB) *DriverRepository { return &DriverRepository{db: db} }

func (r *DriverRepository) GetAll(page, limit int, search string) ([]model.Driver, int, error) {
	offset := (page - 1) * limit
	var total int
	cq := "SELECT COUNT(*) FROM drivers WHERE 1=1"
	q := "SELECT id,name,phone,experience,rating,trips,status,created_at,updated_at FROM drivers WHERE 1=1"
	args := []interface{}{}
	idx := 1
	if search != "" {
		f := fmt.Sprintf(" AND (LOWER(name) LIKE LOWER($%d) OR phone LIKE $%d)", idx, idx)
		cq += f; q += f
		args = append(args, "%"+search+"%"); idx++
	}
	ca := make([]interface{}, len(args)); copy(ca, args)
	r.db.QueryRow(cq, ca...).Scan(&total)
	q += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", idx, idx+1)
	args = append(args, limit, offset)
	rows, err := r.db.Query(q, args...)
	if err != nil { return nil, 0, err }
	defer rows.Close()
	var list []model.Driver
	for rows.Next() {
		var d model.Driver
		rows.Scan(&d.ID, &d.Name, &d.Phone, &d.Experience, &d.Rating, &d.Trips, &d.Status, &d.CreatedAt, &d.UpdatedAt)
		list = append(list, d)
	}
	return list, total, nil
}

func (r *DriverRepository) GetByID(id string) (*model.Driver, error) {
	d := &model.Driver{}
	err := r.db.QueryRow("SELECT id,name,phone,experience,rating,trips,status,created_at,updated_at FROM drivers WHERE id=$1", id).Scan(
		&d.ID, &d.Name, &d.Phone, &d.Experience, &d.Rating, &d.Trips, &d.Status, &d.CreatedAt, &d.UpdatedAt)
	return d, err
}

func (r *DriverRepository) Create(req *model.CreateDriverRequest) (*model.Driver, error) {
	d := &model.Driver{}
	st := req.Status; if st == "" { st = "active" }
	err := r.db.QueryRow(
		"INSERT INTO drivers (name,phone,experience,status) VALUES ($1,$2,$3,$4) RETURNING id,name,phone,experience,rating,trips,status,created_at,updated_at",
		req.Name, req.Phone, req.Experience, st,
	).Scan(&d.ID, &d.Name, &d.Phone, &d.Experience, &d.Rating, &d.Trips, &d.Status, &d.CreatedAt, &d.UpdatedAt)
	return d, err
}

func (r *DriverRepository) Update(id string, req *model.UpdateDriverRequest) (*model.Driver, error) {
	d := &model.Driver{}
	err := r.db.QueryRow(
		"UPDATE drivers SET name=COALESCE(NULLIF($1,''),name),phone=COALESCE(NULLIF($2,''),phone),experience=COALESCE(NULLIF($3,''),experience),status=COALESCE(NULLIF($4,''),status),updated_at=$5 WHERE id=$6 RETURNING id,name,phone,experience,rating,trips,status,created_at,updated_at",
		req.Name, req.Phone, req.Experience, req.Status, time.Now(), id,
	).Scan(&d.ID, &d.Name, &d.Phone, &d.Experience, &d.Rating, &d.Trips, &d.Status, &d.CreatedAt, &d.UpdatedAt)
	return d, err
}

func (r *DriverRepository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM drivers WHERE id=$1", id)
	return err
}
