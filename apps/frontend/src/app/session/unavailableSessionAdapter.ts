import type { SessionAdapter, SessionState } from "./types";

/**
 * Explicitly incomplete production session adapter.
 * Does not fabricate authentication from localStorage or demo credentials.
 * Live BFF session wiring (GET /api/v1/session) remains a follow-up once the
 * generated OpenAPI client is integrated into the frontend package.
 */
export function createUnavailableSessionAdapter(): SessionAdapter {
  return {
    async getSession(): Promise<SessionState> {
      return {
        status: "unavailable",
        internalUserId: null,
        csrfToken: null,
      };
    },
    beginLogin(): void {
      // Controlled no-op: production login redirect requires BFF integration.
    },
    async logout(): Promise<void> {
      // No local session to clear.
    },
  };
}
