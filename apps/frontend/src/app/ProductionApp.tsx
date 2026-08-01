import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { RuntimeProvider } from "@/app/runtime/RuntimeProvider";
import { SessionProvider, useSession } from "@/app/session/SessionProvider";
import { createProductionRuntime } from "@/app/runtime/createProductionRuntime";
import { FeatureUnavailable } from "@/components/runtime/FeatureUnavailable";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  ProductionI18nProvider,
  useProductionI18n,
} from "@/app/i18n/ProductionI18nProvider";
import type { ProductionLocale } from "@/app/i18n/productionCatalog";

const runtime = createProductionRuntime();

function LocaleSwitcher() {
  const { locale, locales, setLocale, t } = useProductionI18n();
  return (
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
  );
}

/**
 * Static production landing — no StoreProvider, fixtures, or demo auth.
 */
function ProductionLanding() {
  const { t } = useProductionI18n();
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
          <span className="font-display text-2xl">{t("brand.name")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Link to="/acesso" data-testid="production-landing-enter">
            <Button size="sm" className="rounded-full">
              {t("landing.enter")} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-10">
        <h1
          data-testid="production-landing-title"
          className="font-display text-4xl md:text-5xl"
        >
          {t("brand.name")}
        </h1>
        <p
          data-testid="production-landing-tagline"
          className="mt-4 text-muted-foreground"
        >
          {t("landing.tagline")}
        </p>
        <p
          data-testid="production-landing-subtitle"
          className="mt-2 text-sm text-muted-foreground"
        >
          {t("landing.subtitle")}
        </p>
        <div className="mt-8">
          <FeatureUnavailable
            feature="production-home"
            title={t("feature.integrationPending")}
            detail={t("home.unavailable.detail")}
          />
        </div>
      </main>
    </div>
  );
}

function ProductionAccess() {
  const { session } = useSession();
  const { t } = useProductionI18n();
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-8">
      <FeatureUnavailable
        feature="access"
        title={
          session.status === "unavailable"
            ? t("feature.serviceUnavailable")
            : t("feature.integrationPending")
        }
        detail={t("access.detail")}
      />
    </div>
  );
}

function ProductionAppShell({ children }: { children: ReactNode }) {
  const { t } = useProductionI18n();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <span className="font-display text-xl">{t("brand.name")}</span>
      </header>
      <main className="mx-auto max-w-3xl p-8">{children}</main>
    </div>
  );
}

function ProductionAppRoutes() {
  const { t } = useProductionI18n();
  return (
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
                title={t("feature.unavailable")}
                detail={t("app.unavailable.detail")}
              />
            </ProductionAppShell>
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
  return (
    <RuntimeProvider runtime={runtime}>
      <SessionProvider adapter={runtime.sessionAdapter}>
        <ProductionI18nProvider>
          <ProductionAppRoutes />
        </ProductionI18nProvider>
      </SessionProvider>
    </RuntimeProvider>
  );
}
