package repository

import (
	"database/sql"
	"fmt"
	"time"
	"github.com/gaslink/vehicle-service/internal/model"
)

type VehicleRepository struct{ db *sql.DB }

func NewVehicleRepository(db *sql.DB) *VehicleRepository { return &VehicleRepository{db: db} }

func (r *VehicleRepository) GetAllVehicles(page, limit int, search string) ([]model.Vehicle, int, error) {
	offset := (page - 1) * limit
	var total int
	cq := "SELECT COUNT(*) FROM vehicles WHERE 1=1"
	q := "SELECT id,plate,model,status,driver_id,driver_name,fuel,mileage,last_service,lat,lng,speed,heading,created_at,updated_at FROM vehicles WHERE 1=1"
	args := []interface{}{}; idx := 1
	if search != "" {
		f := fmt.Sprintf(" AND (LOWER(plate) LIKE LOWER($%d) OR LOWER(driver_name) LIKE LOWER($%d))", idx, idx)
		cq += f; q += f; args = append(args, "%"+search+"%"); idx++
	}
	ca := make([]interface{}, len(args)); copy(ca, args)
	r.db.QueryRow(cq, ca...).Scan(&total)
	q += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", idx, idx+1)
	args = append(args, limit, offset)
	rows, err := r.db.Query(q, args...)
	if err != nil { return nil, 0, err }
	defer rows.Close()
	var list []model.Vehicle
	for rows.Next() {
		var v model.Vehicle; var ls sql.NullString
		rows.Scan(&v.ID, &v.Plate, &v.Model, &v.Status, &v.DriverID, &v.DriverName, &v.Fuel, &v.Mileage, &ls, &v.Lat, &v.Lng, &v.Speed, &v.Heading, &v.CreatedAt, &v.UpdatedAt)
		if ls.Valid { v.LastService = &ls.String }
		list = append(list, v)
	}
	return list, total, nil
}

func (r *VehicleRepository) GetVehicleByID(id string) (*model.Vehicle, error) {
	v := &model.Vehicle{}; var ls sql.NullString
	err := r.db.QueryRow("SELECT id,plate,model,status,driver_id,driver_name,fuel,mileage,last_service,lat,lng,speed,heading,created_at,updated_at FROM vehicles WHERE id=$1", id).Scan(
		&v.ID, &v.Plate, &v.Model, &v.Status, &v.DriverID, &v.DriverName, &v.Fuel, &v.Mileage, &ls, &v.Lat, &v.Lng, &v.Speed, &v.Heading, &v.CreatedAt, &v.UpdatedAt)
	if ls.Valid { v.LastService = &ls.String }
	return v, err
}

func (r *VehicleRepository) CreateVehicle(req *model.CreateVehicleRequest) (*model.Vehicle, error) {
	v := &model.Vehicle{}; st := req.Status; if st == "" { st = "active" }
	var dn *string; if req.DriverName != "" { dn = &req.DriverName }
	err := r.db.QueryRow(
		"INSERT INTO vehicles (plate,model,status,driver_name) VALUES ($1,$2,$3,$4) RETURNING id,plate,model,status,driver_name,fuel,mileage,speed,heading,created_at,updated_at",
		req.Plate, req.Model, st, dn,
	).Scan(&v.ID, &v.Plate, &v.Model, &v.Status, &v.DriverName, &v.Fuel, &v.Mileage, &v.Speed, &v.Heading, &v.CreatedAt, &v.UpdatedAt)
	return v, err
}

func (r *VehicleRepository) UpdateVehicle(id string, req *model.UpdateVehicleRequest) (*model.Vehicle, error) {
	v := &model.Vehicle{}; var ls sql.NullString
	err := r.db.QueryRow(
		"UPDATE vehicles SET plate=COALESCE(NULLIF($1,''),plate),model=COALESCE(NULLIF($2,''),model),status=COALESCE(NULLIF($3,''),status),driver_name=COALESCE(NULLIF($4,''),driver_name),updated_at=$5 WHERE id=$6 RETURNING id,plate,model,status,driver_id,driver_name,fuel,mileage,last_service,lat,lng,speed,heading,created_at,updated_at",
		req.Plate, req.Model, req.Status, req.DriverName, time.Now(), id,
	).Scan(&v.ID, &v.Plate, &v.Model, &v.Status, &v.DriverID, &v.DriverName, &v.Fuel, &v.Mileage, &ls, &v.Lat, &v.Lng, &v.Speed, &v.Heading, &v.CreatedAt, &v.UpdatedAt)
	if ls.Valid { v.LastService = &ls.String }
	return v, err
}

func (r *VehicleRepository) DeleteVehicle(id string) error {
	_, err := r.db.Exec("DELETE FROM vehicles WHERE id=$1", id); return err
}

func (r *VehicleRepository) GetAllTrips(page, limit int) ([]model.Trip, int, error) {
	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM trips").Scan(&total)
	offset := (page - 1) * limit
	rows, err := r.db.Query("SELECT id,vehicle_id,vehicle_name,driver_name,route,fuel_used,status,started_at,completed_at,created_at FROM trips ORDER BY created_at DESC LIMIT $1 OFFSET $2", limit, offset)
	if err != nil { return nil, 0, err }
	defer rows.Close()
	var list []model.Trip
	for rows.Next() {
		var t model.Trip
		rows.Scan(&t.ID, &t.VehicleID, &t.VehicleName, &t.DriverName, &t.Route, &t.FuelUsed, &t.Status, &t.StartedAt, &t.CompletedAt, &t.CreatedAt)
		list = append(list, t)
	}
	return list, total, nil
}

func (r *VehicleRepository) CreateTrip(req *model.CreateTripRequest) (*model.Trip, error) {
	t := &model.Trip{}; st := req.Status; if st == "" { st = "active" }
	err := r.db.QueryRow(
		"INSERT INTO trips (vehicle_name,driver_name,route,fuel_used,status) VALUES ($1,$2,$3,$4,$5) RETURNING id,vehicle_name,driver_name,route,fuel_used,status,started_at,created_at",
		req.VehicleName, req.DriverName, req.Route, req.FuelUsed, st,
	).Scan(&t.ID, &t.VehicleName, &t.DriverName, &t.Route, &t.FuelUsed, &t.Status, &t.StartedAt, &t.CreatedAt)
	return t, err
}

func (r *VehicleRepository) GetDashboardStats() (*model.DashboardStats, error) {
	s := &model.DashboardStats{}
	r.db.QueryRow("SELECT COUNT(*) FROM vehicles").Scan(&s.TotalVehicles)
	r.db.QueryRow("SELECT COUNT(*) FROM vehicles WHERE status='active'").Scan(&s.OnRoute)
	s.FuelConsumption = "12,450 л"
	s.TodayMileage = "34,200 км"
	return s, nil
}
