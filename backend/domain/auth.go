package domain

import (
	"context"
	"time"
)

type Role string

const (
	RoleAdmin     Role = "admin"
	RoleSupervisor Role = "supervisor"
	RoleDeveloper Role = "developer"
	RoleViewer    Role = "viewer"
)

type RoleDef struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Permissions []string  `json:"permissions"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
}

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	SupervisorID string    `json:"supervisor_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Session struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	TokenHash      string    `json:"-"`
	IPAddress      string    `json:"ip_address"`
	UserAgent      string    `json:"user_agent"`
	ExpiresAt      time.Time `json:"expires_at"`
	CreatedAt      time.Time `json:"created_at"`
	LastActivityAt time.Time `json:"last_activity_at"`
}

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id string) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	List(ctx context.Context) ([]*User, error)
	ListSubordinates(ctx context.Context, supervisorID string) ([]*User, error)
	CreateRole(ctx context.Context, role *RoleDef) error
	ListRoles(ctx context.Context) ([]*RoleDef, error)
	DeleteRole(ctx context.Context, id string) error
}

type SessionRepository interface {
	CreateSession(ctx context.Context, session *Session) error
	GetByTokenHash(ctx context.Context, tokenHash string) (*Session, error)
	GetByID(ctx context.Context, id string) (*Session, error)
	ListByUserID(ctx context.Context, userID string) ([]*Session, error)
	DeleteSession(ctx context.Context, id string) error
	DeleteAllUserSessionsExcept(ctx context.Context, userID string, currentSessionID string) error
	UpdateLastActivity(ctx context.Context, id string, lastActivity time.Time) error
	CleanExpiredSessions(ctx context.Context) error
}

type AuthUseCase interface {
	Login(ctx context.Context, username, password, ipAddress, userAgent string) (string, *User, error)
	Register(ctx context.Context, username, password string, role Role) (*User, error)
	CreateSubordinateUser(ctx context.Context, supervisorID, username, password string, role Role) (*User, error)
	ValidateToken(ctx context.Context, rawToken string) (*User, *Session, error)
	GetProfile(ctx context.Context, userID string) (*User, error)
	Logout(ctx context.Context, rawToken string) error
	ListActiveSessions(ctx context.Context, userID string) ([]*Session, error)
	RevokeSession(ctx context.Context, userID string, sessionID string) error
	RevokeOtherSessions(ctx context.Context, userID string, currentSessionID string) error
	CreateRole(ctx context.Context, creatorID, name, description string, permissions []string) (*RoleDef, error)
	ListRoles(ctx context.Context) ([]*RoleDef, error)
	DeleteRole(ctx context.Context, id string) error
	ListSubordinates(ctx context.Context, supervisorID string) ([]*User, error)
}