import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { RuntimeProvider } from "@/app/runtime/RuntimeProvider";
import { SessionProvider, useSession } from "@/app/session/SessionProvider";
import { createProductionRuntime } from "@/app/runtime/createProductionRuntime";
import { FeatureUnavailable } from "@/components/runtime/FeatureUnavailable";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const runtime = createProductionRuntime();

/**
 * Static production landing — no StoreProvider, fixtures, or demo auth.
 */
function ProductionLanding() {
  return (
    <div
      data-testid="production-landing"
      className="min-h-screen bg-background text-foreground"
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg">
            C
          </span>
          <span className="font-display text-2xl">Cocinaris</span>
        </div>
        <Link to="/acesso" data-testid="production-landing-enter">
          <Button size="sm" className="rounded-full">
            Enter <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-10">
        <h1 className="font-display text-4xl md:text-5xl">Cocinaris</h1>
        <p className="mt-4 text-muted-foreground">
          KitchenFlow helps transform available food into useful meals. Live
          product surfaces require backend-managed session and adapters.
        </p>
        <div className="mt-8">
          <FeatureUnavailable
            feature="production-home"
            title="Integration pending"
            detail="Authenticated home, pantry, recipes, planning, shopping, and cook mode are not wired in this production build."
          />
        </div>
      </main>
    </div>
  );
}

function ProductionAccess() {
  const { session } = useSession();
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-8">
      <FeatureUnavailable
        feature="access"
        title={
          session.status === "unavailable"
            ? "Service unavailable"
            : "Integration pending"
        }
        detail="Production builds do not accept local credentials. Backend-managed login is required."
      />
    </div>
  );
}

function ProductionAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <span className="font-display text-xl">Cocinaris</span>
      </header>
      <main className="mx-auto max-w-3xl p-8">{children}</main>
    </div>
  );
}

/**
 * Production composition root.
 * Must not import StoreProvider, mock fixtures, scenario tooling, or synthetic seeds.
 */
export default function ProductionApp() {
  return (
    <RuntimeProvider runtime={runtime}>
      <SessionProvider adapter={runtime.sessionAdapter}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProductionLanding />} />
            <Route path="/acesso" element={<ProductionAccess />} />
            <Route
              path="/app/*"
              element={
                <ProductionAppShell>
                  <FeatureUnavailable
                    feature="app"
                    title="Feature unavailable"
                    detail="Live adapters are not integrated. Production does not fall back to mock pantry, recipes, planning, shopping, or cook data."
                  />
                </ProductionAppShell>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </RuntimeProvider>
  );
}
