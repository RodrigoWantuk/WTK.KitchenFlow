import "@/App.css";
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider, useStore } from "@/lib/store";
import { PreparationRouteProvider } from "@/features/preparation-route/PreparationRouteProvider";
import { RuntimeProvider, useRuntime } from "@/app/runtime/RuntimeProvider";
import { SessionProvider, useSession } from "@/app/session/SessionProvider";
import { createPrototypeRuntime } from "@/app/runtime/createPrototypeRuntime";
import { FeatureUnavailable } from "@/components/runtime/FeatureUnavailable";
import { PrototypeModeBanner } from "@/components/runtime/PrototypeModeBanner";
import AppShell from "@/components/AppShell";
import Access from "@/pages/Access";
import Onboarding from "@/pages/Onboarding";
import Pantry from "@/pages/Pantry";
import { ProductionI18nProvider } from "@/app/i18n/ProductionI18nProvider";
import { PublicEntryPage } from "@/features/entry/PublicEntryPage";
import { PrototypeContextualHomeRoute } from "@/features/home/PrototypeContextualHomeRoute";
import ItemForm from "@/pages/ItemForm";
import ItemDetail from "@/pages/ItemDetail";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";
import CookFlow from "@/pages/CookFlow";
import Plan from "@/pages/Plan";
import Shopping from "@/pages/Shopping";
import Settings from "@/pages/Settings";

const runtime = createPrototypeRuntime();

function Guard({ children }: { children: ReactNode }) {
  const { session, isAuthenticated } = useSession();
  const { persistPrototypeAuth, enablePrototypeFixtures } = useRuntime();
  const { authed } = useStore();

  if (session.status === "loading") {
    return (
      <div
        data-testid="session-loading"
        className="grid min-h-screen place-items-center text-sm text-muted-foreground"
      >
        Loading session…
      </div>
    );
  }

  if (session.status === "unavailable" && !enablePrototypeFixtures) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <FeatureUnavailable
          feature="session"
          title="Service unavailable"
          detail="Backend-managed session integration is pending. Production builds do not use local authentication."
        />
      </div>
    );
  }

  const allowed =
    isAuthenticated ||
    (persistPrototypeAuth && enablePrototypeFixtures && authed);
  if (!allowed) return <Navigate to="/acesso" replace />;
  return children;
}

function ShellRoute({ children }: { children: ReactNode }) {
  return (
    <Guard>
      <AppShell>{children}</AppShell>
    </Guard>
  );
}

function AppRoutes() {
  const { prototypeBanner } = useRuntime();
  return (
    <>
      {prototypeBanner ? <PrototypeModeBanner /> : null}
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProductionI18nProvider>
                <PublicEntryPage />
              </ProductionI18nProvider>
            }
          />
          <Route path="/acesso" element={<Access />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route
            path="/app/hoje"
            element={
              <ShellRoute>
                <ProductionI18nProvider>
                  <PrototypeContextualHomeRoute />
                </ProductionI18nProvider>
              </ShellRoute>
            }
          />
          <Route
            path="/app/despensa"
            element={
              <ShellRoute>
                <Pantry />
              </ShellRoute>
            }
          />
          <Route
            path="/app/despensa/novo"
            element={
              <ShellRoute>
                <ItemForm />
              </ShellRoute>
            }
          />
          <Route
            path="/app/despensa/:id"
            element={
              <ShellRoute>
                <ItemDetail />
              </ShellRoute>
            }
          />
          <Route
            path="/app/receitas"
            element={
              <ShellRoute>
                <Recipes />
              </ShellRoute>
            }
          />
          <Route
            path="/app/receitas/:id"
            element={
              <ShellRoute>
                <RecipeDetail />
              </ShellRoute>
            }
          />
          <Route
            path="/app/cozinhar/:id"
            element={
              <ShellRoute>
                <CookFlow />
              </ShellRoute>
            }
          />
          <Route
            path="/app/planejamento"
            element={
              <ShellRoute>
                <Plan />
              </ShellRoute>
            }
          />
          <Route
            path="/app/compras"
            element={
              <ShellRoute>
                <Shopping />
              </ShellRoute>
            }
          />
          <Route
            path="/app/ajustes"
            element={
              <ShellRoute>
                <Settings />
              </ShellRoute>
            }
          />

          <Route path="/app" element={<Navigate to="/app/hoje" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function App() {
  return (
    <RuntimeProvider runtime={runtime}>
      <SessionProvider adapter={runtime.sessionAdapter}>
        <StoreProvider
          enablePrototypeFixtures={runtime.enablePrototypeFixtures}
          persistPrototypeAuth={runtime.persistPrototypeAuth}
        >
          <PreparationRouteProvider
            repository={runtime.preparationRouteRepository}
          >
            <AppRoutes />
          </PreparationRouteProvider>
        </StoreProvider>
      </SessionProvider>
    </RuntimeProvider>
  );
}

/**
 * Prototype composition root: fixtures, ScenarioBar, demo auth, and local store.
 */
export default App;
