import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionAdapter, SessionState } from "./types";

interface SessionContextValue {
  session: SessionState;
  refresh: () => Promise<void>;
  beginLogin: (returnUrl?: string) => void;
  logout: () => Promise<void>;
  /** Convenience: true only for authenticated status. */
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Loads session state through the injected SessionAdapter.
 */
export function SessionProvider({
  adapter,
  children,
}: {
  adapter: SessionAdapter;
  children: ReactNode;
}) {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setSession({ status: "loading" });
    const next = await adapter.getSession();
    setSession(next);
  }, [adapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      refresh,
      beginLogin: (returnUrl?: string) => {
        // Login uses a full-document BFF challenge navigation; do not race a refresh.
        adapter.beginLogin(returnUrl);
      },
      logout: async () => {
        await adapter.logout();
        await refresh();
      },
      isAuthenticated: session.status === "authenticated",
    }),
    [adapter, refresh, session],
  );

  return createElement(SessionContext.Provider, { value }, children);
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
