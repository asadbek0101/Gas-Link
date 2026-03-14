package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/gaslink/user-service/internal/model"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetAll(page, limit int, search string) ([]model.User, int, error) {
	offset := (page - 1) * limit
	var total int

	countQuery := `SELECT COUNT(*) FROM users WHERE 1=1`
	query := `SELECT id, name, email, role, status, last_login, created_at, updated_at FROM users WHERE 1=1`

	args := []interface{}{}
	argIdx := 1

	if search != "" {
		filter := fmt.Sprintf(` AND (LOWER(name) LIKE LOWER($%d) OR LOWER(email) LIKE LOWER($%d))`, argIdx, argIdx)
		countQuery += filter
		query += filter
		args = append(args, "%"+search+"%")
		argIdx++
	}

	countArgs := make([]interface{}, len(args))
	copy(countArgs, args)
	r.db.QueryRow(countQuery, countArgs...).Scan(&total)

	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.Status, &u.LastLogin, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, nil
}

func (r *UserRepository) GetByID(id string) (*model.User, error) {
	u := &model.User{}
	err := r.db.QueryRow(
		`SELECT id, name, email, role, status, last_login, created_at, updated_at
		 FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.Status, &u.LastLogin, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *UserRepository) Create(req *model.CreateUserRequest) (*model.User, error) {
	u := &model.User{}
	status := req.Status
	if status == "" {
		status = "active"
	}
	err := r.db.QueryRow(
		`INSERT INTO users (name, email, password_hash, role, status)
		 VALUES ($1, $2, '$2a$10$placeholder', $3, $4)
		 RETURNING id, name, email, role, status, created_at, updated_at`,
		req.Name, req.Email, req.Role, status,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.Status, &u.CreatedAt, &u.UpdatedAt)
	return u, err
}

func (r *UserRepository) Update(id string, req *model.UpdateUserRequest) (*model.User, error) {
	u := &model.User{}
	now := time.Now()
	err := r.db.QueryRow(
		`UPDATE users SET
			name = COALESCE(NULLIF($1, ''), name),
			email = COALESCE(NULLIF($2, ''), email),
			role = COALESCE(NULLIF($3, ''), role),
			status = COALESCE(NULLIF($4, ''), status),
			updated_at = $5
		 WHERE id = $6
		 RETURNING id, name, email, role, status, last_login, created_at, updated_at`,
		req.Name, req.Email, req.Role, req.Status, now, id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.Status, &u.LastLogin, &u.CreatedAt, &u.UpdatedAt)
	return u, err
}

func (r *UserRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM users WHERE id = $1`, id)
	return err
}
