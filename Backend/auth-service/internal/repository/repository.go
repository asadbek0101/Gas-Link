package repository

import (
	"database/sql"
	"time"

	"github.com/gaslink/auth-service/internal/model"
)

type AuthRepository struct {
	db *sql.DB
}

func NewAuthRepository(db *sql.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) FindByEmail(email string) (*model.User, error) {
	user := &model.User{}
	err := r.db.QueryRow(
		`SELECT id, name, email, password_hash, role, status, last_login, created_at, updated_at
		 FROM users WHERE email = $1`, email,
	).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role,
		&user.Status, &user.LastLogin, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *AuthRepository) Create(user *model.User) error {
	return r.db.QueryRow(
		`INSERT INTO users (name, email, password_hash, role, status)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at, updated_at`,
		user.Name, user.Email, user.PasswordHash, user.Role, user.Status,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *AuthRepository) UpdateLastLogin(userID string) error {
	now := time.Now()
	_, err := r.db.Exec(
		`UPDATE users SET last_login = $1, updated_at = $2 WHERE id = $3`,
		now, now, userID,
	)
	return err
}
