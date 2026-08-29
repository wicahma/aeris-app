package usecase

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"project-aeris/backend/domain"
	"golang.org/x/crypto/bcrypt"
)

type authUseCase struct {
	userRepo    domain.UserRepository
	sessionRepo domain.SessionRepository
}

func NewAuthUseCase(userRepo domain.UserRepository, sessionRepo domain.SessionRepository) domain.AuthUseCase {
	uc := &authUseCase{
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
	}

	go uc.startSessionCleaner()
	return uc
}

func (uc *authUseCase) Login(ctx context.Context, username, password, ipAddress, userAgent string) (string, *domain.User, error) {
	user, err := uc.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return "", nil, fmt.Errorf("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", nil, fmt.Errorf("invalid credentials")
	}

	rawToken, tokenHash, err := generateStatefulToken()
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate session token: %w", err)
	}

	sessID := fmt.Sprintf("sess_%s", generateRandomID(8))
	session := &domain.Session{
		ID:             sessID,
		UserID:         user.ID,
		TokenHash:      tokenHash,
		IPAddress:      ipAddress,
		UserAgent:      userAgent,
		ExpiresAt:      time.Now().Add(7 * 24 * time.Hour),
		CreatedAt:      time.Now(),
		LastActivityAt: time.Now(),
	}

	if err := uc.sessionRepo.CreateSession(ctx, session); err != nil {
		return "", nil, fmt.Errorf("failed to store session: %w", err)
	}

	return rawToken, user, nil
}

func (uc *authUseCase) Register(ctx context.Context, username, password string, role domain.Role) (*domain.User, error) {
	existing, _ := uc.userRepo.GetByUsername(ctx, username)
	if existing != nil {
		return nil, fmt.Errorf("username already taken")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &domain.User{
		ID:           fmt.Sprintf("usr_%s", generateRandomID(8)),
		Username:     username,
		PasswordHash: string(hashed),
		Role:         role,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (uc *authUseCase) CreateSubordinateUser(ctx context.Context, supervisorID, username, password string, role domain.Role) (*domain.User, error) {
	existing, _ := uc.userRepo.GetByUsername(ctx, username)
	if existing != nil {
		return nil, fmt.Errorf("username already taken")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &domain.User{
		ID:           fmt.Sprintf("usr_%s", generateRandomID(8)),
		Username:     username,
		PasswordHash: string(hashed),
		Role:         role,
		SupervisorID: supervisorID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create subordinate user: %w", err)
	}

	return user, nil
}

func (uc *authUseCase) ValidateToken(ctx context.Context, rawToken string) (*domain.User, *domain.Session, error) {
	tokenHash := hashToken(rawToken)

	session, err := uc.sessionRepo.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, nil, fmt.Errorf("unauthorized: %w", err)
	}

	user, err := uc.userRepo.GetByID(ctx, session.UserID)
	if err != nil {
		return nil, nil, fmt.Errorf("unauthorized: user not found")
	}

	go func(sessID string) {
		bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		uc.sessionRepo.UpdateLastActivity(bgCtx, sessID, time.Now())
	}(session.ID)

	return user, session, nil
}

func (uc *authUseCase) Logout(ctx context.Context, rawToken string) error {
	tokenHash := hashToken(rawToken)
	session, err := uc.sessionRepo.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil
	}
	return uc.sessionRepo.DeleteSession(ctx, session.ID)
}

func (uc *authUseCase) ListActiveSessions(ctx context.Context, userID string) ([]*domain.Session, error) {
	return uc.sessionRepo.ListByUserID(ctx, userID)
}

func (uc *authUseCase) RevokeSession(ctx context.Context, userID string, sessionID string) error {
	session, err := uc.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("session not found")
	}

	if session.UserID != userID {
		return fmt.Errorf("forbidden: cannot revoke session belonging to another user")
	}

	return uc.sessionRepo.DeleteSession(ctx, sessionID)
}

func (uc *authUseCase) RevokeOtherSessions(ctx context.Context, userID string, currentSessionID string) error {
	return uc.sessionRepo.DeleteAllUserSessionsExcept(ctx, userID, currentSessionID)
}

func (uc *authUseCase) GetProfile(ctx context.Context, userID string) (*domain.User, error) {
	return uc.userRepo.GetByID(ctx, userID)
}

func (uc *authUseCase) CreateRole(ctx context.Context, creatorID, name, description string, permissions []string) (*domain.RoleDef, error) {
	role := &domain.RoleDef{
		ID:          fmt.Sprintf("role_%s", generateRandomID(6)),
		Name:        name,
		Description: description,
		Permissions: permissions,
		CreatedBy:   creatorID,
		CreatedAt:   time.Now(),
	}

	if err := uc.userRepo.CreateRole(ctx, role); err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	return role, nil
}

func (uc *authUseCase) ListRoles(ctx context.Context) ([]*domain.RoleDef, error) {
	return uc.userRepo.ListRoles(ctx)
}

func (uc *authUseCase) DeleteRole(ctx context.Context, id string) error {
	return uc.userRepo.DeleteRole(ctx, id)
}

func (uc *authUseCase) ListSubordinates(ctx context.Context, supervisorID string) ([]*domain.User, error) {
	return uc.userRepo.ListSubordinates(ctx, supervisorID)
}

func (uc *authUseCase) startSessionCleaner() {
	ticker := time.NewTicker(1 * time.Hour)
	for range ticker.C {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		_ = uc.sessionRepo.CleanExpiredSessions(ctx)
		cancel()
	}
}

func generateStatefulToken() (string, string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", err
	}
	rawToken := fmt.Sprintf("aeris_sess_%s", hex.EncodeToString(bytes))
	return rawToken, hashToken(rawToken), nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func generateRandomID(n int) string {
	bytes := make([]byte, n)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}