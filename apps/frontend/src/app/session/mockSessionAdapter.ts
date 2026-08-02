import type { SessionAdapter, SessionState } from "./types";

/**
 * Prototype-only session that mirrors the historical local `authed` flag.
 * Must not be wired into production composition roots.
 */
export function createMockSessionAdapter(options?: {
  initiallyAuthenticated?: boolean;
  displayName?: string | null;
  timeZone?: string | null;
  onAuthChange?: (authenticated: boolean) => void;
}): SessionAdapter {
  let authenticated = options?.initiallyAuthenticated ?? false;

  return {
    async getSession(): Promise<SessionState> {
      return authenticated
        ? {
            status: "authenticated",
            internalUserId: "prototype-user",
            csrfToken: null,
            displayName: options?.displayName ?? null,
            timeZone: options?.timeZone ?? null,
          }
        : { status: "signedOut", internalUserId: null, csrfToken: null };
    },
    beginLogin(): void {
      authenticated = true;
      options?.onAuthChange?.(true);
    },
    async logout(): Promise<void> {
      authenticated = false;
      options?.onAuthChange?.(false);
    },
  };
}
