package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"project-aeris/backend/domain"
)

type userRepository struct {
	sysDB *SystemDB
}

func NewUserRepository(sysDB *SystemDB) domain.UserRepository {
	return &userRepository{sysDB: sysDB}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	query := `INSERT INTO _system_users (id, username, password_hash, role, supervisor_id, created_at, updated_at)
	          VALUES (?, ?, ?, ?, ?, ?, ?);`
	_, err := r.sysDB.GetDB().ExecContext(ctx, query,
		user.ID,
		user.Username,
		user.PasswordHash,
		string(user.Role),
		user.SupervisorID,
		user.CreatedAt,
		user.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `SELECT id, username, password_hash, role, COALESCE(supervisor_id, ''), created_at, updated_at
	          FROM _system_users WHERE username = ?;`
	row := r.sysDB.GetDB().QueryRowContext(ctx, query, username)

	var u domain.User
	var roleStr string
	var createdAt, updatedAt time.Time

	err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &roleStr, &u.SupervisorID, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	u.Role = domain.Role(roleStr)
	u.CreatedAt = createdAt
	u.UpdatedAt = updatedAt
	return &u, nil
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	query := `SELECT id, username, password_hash, role, COALESCE(supervisor_id, ''), created_at, updated_at
	          FROM _system_users WHERE id = ?;`
	row := r.sysDB.GetDB().QueryRowContext(ctx, query, id)

	var u domain.User
	var roleStr string
	var createdAt, updatedAt time.Time

	err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &roleStr, &u.SupervisorID, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	u.Role = domain.Role(roleStr)
	u.CreatedAt = createdAt
	u.UpdatedAt = updatedAt
	return &u, nil
}

func (r *userRepository) List(ctx context.Context) ([]*domain.User, error) {
	query := `SELECT id, username, password_hash, role, COALESCE(supervisor_id, ''), created_at, updated_at FROM _system_users ORDER BY username;`
	rows, err := r.sysDB.GetDB().QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]*domain.User, 0)
	for rows.Next() {
		var u domain.User
		var roleStr string
		var createdAt, updatedAt time.Time

		if err := rows.Scan(&u.ID, &u.Username, &u.PasswordHash, &roleStr, &u.SupervisorID, &createdAt, &updatedAt); err != nil {
			return nil, err
		}

		u.Role = domain.Role(roleStr)
		u.CreatedAt = createdAt
		u.UpdatedAt = updatedAt
		users = append(users, &u)
	}

	return users, nil
}

func (r *userRepository) ListSubordinates(ctx context.Context, supervisorID string) ([]*domain.User, error) {
	query := `SELECT id, username, password_hash, role, COALESCE(supervisor_id, ''), created_at, updated_at FROM _system_users WHERE supervisor_id = ? ORDER BY username;`
	rows, err := r.sysDB.GetDB().QueryContext(ctx, query, supervisorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]*domain.User, 0)
	for rows.Next() {
		var u domain.User
		var roleStr string
		var createdAt, updatedAt time.Time

		if err := rows.Scan(&u.ID, &u.Username, &u.PasswordHash, &roleStr, &u.SupervisorID, &createdAt, &updatedAt); err != nil {
			return nil, err
		}

		u.Role = domain.Role(roleStr)
		u.CreatedAt = createdAt
		u.UpdatedAt = updatedAt
		users = append(users, &u)
	}

	return users, nil
}

func (r *userRepository) CreateRole(ctx context.Context, role *domain.RoleDef) error {
	permsJSON, err := json.Marshal(role.Permissions)
	if err != nil {
		return err
	}

	query := `INSERT INTO _system_roles (id, name, description, permissions_json, created_by, created_at)
	          VALUES (?, ?, ?, ?, ?, ?);`
	_, err = r.sysDB.GetDB().ExecContext(ctx, query,
		role.ID,
		role.Name,
		role.Description,
		string(permsJSON),
		role.CreatedBy,
		role.CreatedAt,
	)
	return err
}

func (r *userRepository) ListRoles(ctx context.Context) ([]*domain.RoleDef, error) {
	query := `SELECT id, name, description, permissions_json, created_by, created_at FROM _system_roles ORDER BY created_at DESC;`
	rows, err := r.sysDB.GetDB().QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := make([]*domain.RoleDef, 0)
	for rows.Next() {
		var role domain.RoleDef
		var permsJSON string

		if err := rows.Scan(&role.ID, &role.Name, &role.Description, &permsJSON, &role.CreatedBy, &role.CreatedAt); err != nil {
			return nil, err
		}

		_ = json.Unmarshal([]byte(permsJSON), &role.Permissions)
		roles = append(roles, &role)
	}

	return roles, nil
}

func (r *userRepository) DeleteRole(ctx context.Context, id string) error {
	query := `DELETE FROM _system_roles WHERE id = ?;`
	_, err := r.sysDB.GetDB().ExecContext(ctx, query, id)
	return err
}