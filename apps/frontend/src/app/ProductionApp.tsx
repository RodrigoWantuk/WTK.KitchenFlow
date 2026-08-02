import { useMemo, type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { RuntimeProvider, useRuntime } from "@/app/runtime/RuntimeProvider";
import { SessionProvider, useSession } from "@/app/session/SessionProvider";
import { createProductionRuntime } from "@/app/runtime/createProductionRuntime";
import { FeatureUnavailable } from "@/components/runtime/FeatureUnavailable";
import { Button } from "@/components/ui/button";
import {
  ProductionI18nProvider,
  useProductionI18n,
} from "@/app/i18n/ProductionI18nProvider";
import type { ProductionLocale } from "@/app/i18n/productionCatalog";
import { InventoryProvider } from "@/features/inventory/InventoryProvider";
import { ProductionInventoryList } from "@/features/inventory/ProductionInventoryList";
import { ProductionInventoryDetail } from "@/features/inventory/ProductionInventoryDetail";
import { ProductionInventoryForm } from "@/features/inventory/ProductionInventoryForm";
import { PublicEntryPage } from "@/features/entry/PublicEntryPage";
import { ContextualHomePage } from "@/features/home/ContextualHomePage";
import { ContextualHomeProvider } from "@/features/home/ContextualHomeProvider";

function LocaleSwitcher() {
  const { locale, locales, setLocale, t } = useProductionI18n();
  return (
    <>
      <div
        className="hidden gap-1 sm:flex"
        role="group"
        aria-label={t("lang.label")}
      >
        {locales.map((code) => (
          <button
            key={code}
            type="button"
            data-testid={`production-lang-${code}`}
            aria-pressed={locale === code}
            onClick={() => setLocale(code as ProductionLocale)}
            className={`rounded-full px-3 py-1 text-xs ${
              locale === code ? "bg-secondary" : "text-muted-foreground"
            }`}
          >
            {code === "pt-BR" ? "PT-BR" : code.toUpperCase()}
          </button>
        ))}
      </div>
      <label className="sm:hidden">
        <span className="sr-only">{t("lang.label")}</span>
        <select
          data-testid="production-lang-select"
          aria-label={t("lang.label")}
          className="max-w-[5.5rem] rounded-md border border-border bg-background px-2 py-1 text-xs"
          value={locale}
          onChange={(event) =>
            setLocale(event.target.value as ProductionLocale)
          }
        >
          {locales.map((code) => (
            <option key={code} value={code}>
              {code === "pt-BR" ? "PT-BR" : code.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function ProductionAccess() {
  const { session, beginLogin } = useSession();
  const { t } = useProductionI18n();
  const location = useLocation();
  const returnUrl =
    (location.state as { from?: string } | null)?.from ?? "/app/hoje";

  if (session.status === "loading") {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center p-8">
        <p role="status">{t("inventory.loading")}</p>
      </div>
    );
  }

  if (session.status === "authenticated") {
    return <Navigate to="/app/hoje" replace />;
  }

  if (session.status === "unavailable") {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center p-8">
        <FeatureUnavailable
          feature="access"
          title={t("feature.serviceUnavailable")}
          detail={t("access.detail")}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="production-access"
      className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-8"
    >
      <h1 className="font-display text-3xl">{t("access.loginTitle")}</h1>
      <p className="text-muted-foreground">{t("access.loginDetail")}</p>
      {session.status === "expired" && (
        <p role="status" className="text-sm text-warning-foreground">
          {t("access.expired")}
        </p>
      )}
      <Button
        type="button"
        data-testid="production-login"
        onClick={() => beginLogin(returnUrl)}
      >
        {t("access.loginAction")}
      </Button>
    </div>
  );
}

function ProductionAppShell({ children }: { children: ReactNode }) {
  const { t } = useProductionI18n();
  const { session, logout, isAuthenticated } = useSession();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link to="/app/hoje" className="font-display text-xl">
            {t("brand.name")}
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            {isAuthenticated && (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {session.displayName || t("access.signedIn")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  data-testid="production-logout"
                  onClick={() => void logout()}
                >
                  {t("access.logout")}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-8">{children}</main>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();
  if (session.status === "loading") {
    return <p role="status">…</p>;
  }
  if (session.status !== "authenticated") {
    return (
      <Navigate to="/acesso" replace state={{ from: location.pathname }} />
    );
  }
  return <>{children}</>;
}

function HomeRoute() {
  const runtime = useRuntime();
  // Production wires the unavailable adapter; prototype composition may inject mocks
  // via a separate app root — never through createProductionRuntime.
  return (
    <ContextualHomeProvider adapter={runtime.contextualHomeAdapter}>
      <ContextualHomePage />
    </ContextualHomeProvider>
  );
}

function ProductionAppRoutes() {
  const { t } = useProductionI18n();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicEntryPage />} />
        <Route path="/acesso" element={<ProductionAccess />} />
        <Route
          path="/app/hoje"
          element={
            <RequireAuth>
              <ProductionAppShell>
                <HomeRoute />
              </ProductionAppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <Navigate to="/app/hoje" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/app/despensa"
          element={
            <RequireAuth>
              <ProductionAppShell>
                <ProductionInventoryList />
              </ProductionAppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/app/despensa/novo"
          element={
            <RequireAuth>
              <ProductionAppShell>
                <ProductionInventoryForm mode="create" />
              </ProductionAppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/app/despensa/:lotId/editar"
          element={
            <RequireAuth>
              <ProductionAppShell>
                <ProductionInventoryForm mode="edit" />
              </ProductionAppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/app/despensa/:lotId"
          element={
            <RequireAuth>
              <ProductionAppShell>
                <ProductionInventoryDetail />
              </ProductionAppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <ProductionAppShell>
                <FeatureUnavailable
                  feature="app"
                  title={t("feature.unavailable")}
                  detail={t("app.unavailable.detail")}
                />
              </ProductionAppShell>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Production composition root.
 * Must not import StoreProvider, mock fixtures, scenario tooling, or synthetic seeds.
 */
export default function ProductionApp() {
  // Compose once per mount so tests can stub globalThis.fetch before render.
  const runtime = useMemo(() => createProductionRuntime(), []);
  return (
    <RuntimeProvider runtime={runtime}>
      <SessionProvider adapter={runtime.sessionAdapter}>
        <InventoryProvider repository={runtime.inventoryRepository}>
          <ProductionI18nProvider>
            <ProductionAppRoutes />
          </ProductionI18nProvider>
        </InventoryProvider>
      </SessionProvider>
    </RuntimeProvider>
  );
}
