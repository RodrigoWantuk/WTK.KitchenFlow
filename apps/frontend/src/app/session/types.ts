/**
 * Backend-managed session states exposed to the UI.
 * Tokens and credentials must never be stored in the browser by these adapters.
 */
export type SessionStatus =
  | "loading"
  | "authenticated"
  | "signedOut"
  | "expired"
  | "unavailable";

export interface SessionState {
  status: SessionStatus;
  /** Internal KitchenFlow user id when authenticated; never an OIDC token. */
  internalUserId?: string | null;
  /** CSRF token from GET /api/v1/session when available. */
  csrfToken?: string | null;
}

/**
 * Session boundary compatible with the backend-managed browser session.
 */
export interface SessionAdapter {
  getSession(): Promise<SessionState>;
  beginLogin(returnUrl?: string): void;
  logout(): Promise<void>;
}
