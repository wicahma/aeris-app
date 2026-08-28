package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"project-aeris/backend/domain"
)

type sessionRepository struct {
	sysDB *SystemDB
}

func NewSessionRepository(sysDB *SystemDB) domain.SessionRepository {
	return &sessionRepository{sysDB: sysDB}
}

func (r *sessionRepository) CreateSession(ctx context.Context, session *domain.Session) error {
	query := `
		INSERT INTO _system_sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_activity_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?);
	`
	_, err := r.sysDB.GetDB().ExecContext(
		ctx,
		query,
		session.ID,
		session.UserID,
		session.TokenHash,
		session.IPAddress,
		session.UserAgent,
		session.ExpiresAt,
		session.CreatedAt,
		session.LastActivityAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	return nil
}

func (r *sessionRepository) GetByTokenHash(ctx context.Context, tokenHash string) (*domain.Session, error) {
	query := `
		SELECT id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_activity_at
		FROM _system_sessions
		WHERE token_hash = ? AND expires_at > ?;
	`
	row := r.sysDB.GetDB().QueryRowContext(ctx, query, tokenHash, time.Now())

	var sess domain.Session
	err := row.Scan(
		&sess.ID,
		&sess.UserID,
		&sess.TokenHash,
		&sess.IPAddress,
		&sess.UserAgent,
		&sess.ExpiresAt,
		&sess.CreatedAt,
		&sess.LastActivityAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("session not found or expired")
		}
		return nil, err
	}
	return &sess, nil
}

func (r *sessionRepository) GetByID(ctx context.Context, id string) (*domain.Session, error) {
	query := `
		SELECT id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_activity_at
		FROM _system_sessions
		WHERE id = ?;
	`
	row := r.sysDB.GetDB().QueryRowContext(ctx, query, id)

	var sess domain.Session
	err := row.Scan(
		&sess.ID,
		&sess.UserID,
		&sess.TokenHash,
		&sess.IPAddress,
		&sess.UserAgent,
		&sess.ExpiresAt,
		&sess.CreatedAt,
		&sess.LastActivityAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("session not found")
		}
		return nil, err
	}
	return &sess, nil
}

func (r *sessionRepository) ListByUserID(ctx context.Context, userID string) ([]*domain.Session, error) {
	query := `
		SELECT id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_activity_at
		FROM _system_sessions
		WHERE user_id = ? AND expires_at > ?
		ORDER BY last_activity_at DESC;
	`
	rows, err := r.sysDB.GetDB().QueryContext(ctx, query, userID, time.Now())
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sessions := make([]*domain.Session, 0)
	for rows.Next() {
		var sess domain.Session
		err := rows.Scan(
			&sess.ID,
			&sess.UserID,
			&sess.TokenHash,
			&sess.IPAddress,
			&sess.UserAgent,
			&sess.ExpiresAt,
			&sess.CreatedAt,
			&sess.LastActivityAt,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &sess)
	}
	return sessions, nil
}

func (r *sessionRepository) DeleteSession(ctx context.Context, id string) error {
	query := `DELETE FROM _system_sessions WHERE id = ?;`
	_, err := r.sysDB.GetDB().ExecContext(ctx, query, id)
	return err
}

func (r *sessionRepository) DeleteAllUserSessionsExcept(ctx context.Context, userID string, currentSessionID string) error {
	query := `DELETE FROM _system_sessions WHERE user_id = ? AND id != ?;`
	_, err := r.sysDB.GetDB().ExecContext(ctx, query, userID, currentSessionID)
	return err
}

func (r *sessionRepository) UpdateLastActivity(ctx context.Context, id string, lastActivity time.Time) error {
	query := `UPDATE _system_sessions SET last_activity_at = ? WHERE id = ?;`
	_, err := r.sysDB.GetDB().ExecContext(ctx, query, lastActivity, id)
	return err
}

func (r *sessionRepository) CleanExpiredSessions(ctx context.Context) error {
	query := `DELETE FROM _system_sessions WHERE expires_at <= ?;`
	_, err := r.sysDB.GetDB().ExecContext(ctx, query, time.Now())
	return err
}