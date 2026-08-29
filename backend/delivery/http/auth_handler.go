package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"project-aeris/backend/domain"
)

type AuthHandler struct {
	authUC domain.AuthUseCase
}

func NewAuthHandler(authUC domain.AuthUseCase) *AuthHandler {
	return &AuthHandler{authUC: authUC}
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type registerRequest struct {
	Username string      `json:"username"`
	Password string      `json:"password"`
	Role     domain.Role `json:"role"`
}

type createRoleRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

type createSubordinateRequest struct {
	Username string      `json:"username"`
	Password string      `json:"password"`
	Role     domain.Role `json:"role"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	ipAddress := r.RemoteAddr
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		ipAddress = strings.Split(forwarded, ",")[0]
	}

	userAgent := r.Header.Get("User-Agent")
	if userAgent == "" {
		userAgent = "Unknown Client"
	}

	token, user, err := h.authUC.Login(r.Context(), req.Username, req.Password, ipAddress, userAgent)
	if err != nil {
		httpError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"token": token,
		"user":  user,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	rawToken := extractRawToken(r)
	if rawToken != "" {
		_ = h.authUC.Logout(r.Context(), rawToken)
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if req.Role == "" {
		req.Role = domain.RoleDeveloper
	}

	user, err := h.authUC.Register(r.Context(), req.Username, req.Password, req.Role)
	if err != nil {
		httpError(w, err.Error(), http.StatusBadRequest)
		return
	}

	jsonResponse(w, http.StatusCreated, user)
}

func (h *AuthHandler) CreateSubordinate(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*domain.User)
	if !ok || user == nil {
		httpError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req createSubordinateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	subordinate, err := h.authUC.CreateSubordinateUser(r.Context(), user.ID, req.Username, req.Password, req.Role)
	if err != nil {
		httpError(w, err.Error(), http.StatusBadRequest)
		return
	}

	jsonResponse(w, http.StatusCreated, subordinate)
}

func (h *AuthHandler) ListSubordinates(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*domain.User)
	if !ok || user == nil {
		httpError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	subordinates, err := h.authUC.ListSubordinates(r.Context(), user.ID)
	if err != nil {
		httpError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, subordinates)
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*domain.User)
	if !ok || user == nil {
		httpError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	fullUser, err := h.authUC.GetProfile(r.Context(), user.ID)
	if err != nil {
		jsonResponse(w, http.StatusOK, user)
		return
	}

	jsonResponse(w, http.StatusOK, fullUser)
}

func (h *AuthHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*domain.User)
	if !ok || user == nil {
		httpError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	sessions, err := h.authUC.ListActiveSessions(r.Context(), user.ID)
	if err != nil {
		httpError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, sessions)
}

func (h *AuthHandler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*domain.User)
	if !ok || user == nil {
		httpError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	sessionID := r.PathValue("id")
	if sessionID == "" {
		httpError(w, "Session ID parameter required", http.StatusBadRequest)
		return
	}

	if err := h.authUC.RevokeSession(r.Context(), user.ID, sessionID); err != nil {
		httpError(w, err.Error(), http.StatusBadRequest)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Session revoked successfully"})
}

func (h *AuthHandler) RevokeAllOtherSessions(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*domain.User)
	currentSession, _ := r.Context().Value(SessionContextKey).(*domain.Session)
	if !ok || user == nil || currentSession == nil {
		httpError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.authUC.RevokeOtherSessions(r.Context(), user.ID, currentSession.ID); err != nil {
		httpError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "All other sessions revoked successfully"})
}

func (h *AuthHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(UserContextKey).(*domain.User)
	if !ok || user == nil {
		httpError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req createRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	role, err := h.authUC.CreateRole(r.Context(), user.ID, req.Name, req.Description, req.Permissions)
	if err != nil {
		httpError(w, err.Error(), http.StatusBadRequest)
		return
	}

	jsonResponse(w, http.StatusCreated, role)
}

func (h *AuthHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	roles, err := h.authUC.ListRoles(r.Context())
	if err != nil {
		httpError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, roles)
}

func (h *AuthHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	roleID := r.PathValue("id")
	if roleID == "" {
		httpError(w, "Role ID required", http.StatusBadRequest)
		return
	}

	if err := h.authUC.DeleteRole(r.Context(), roleID); err != nil {
		httpError(w, err.Error(), http.StatusBadRequest)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Role deleted successfully"})
}

func extractRawToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		authHeader = r.URL.Query().Get("token")
		if authHeader != "" {
			return authHeader
		}
	}
	parts := strings.Split(authHeader, " ")
	if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
		return parts[1]
	}
	return ""
}