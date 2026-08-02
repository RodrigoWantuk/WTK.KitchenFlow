import type { ReactNode } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Home,
  Package,
  BookOpen,
  CalendarDays,
  ShoppingBag,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useRuntime } from "@/app/runtime/RuntimeProvider";
import { languages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import ScenarioBar from "@/components/ScenarioBar";

const links = [
  { to: "/app/hoje", key: "today", icon: Home },
  { to: "/app/despensa", key: "pantry", icon: Package },
  { to: "/app/receitas", key: "recipes", icon: BookOpen },
  { to: "/app/planejamento", key: "plan", icon: CalendarDays },
  { to: "/app/compras", key: "shopping", icon: ShoppingBag },
];

function Brand() {
  return (
    <Link
      to="/app/hoje"
      data-testid="brand-link"
      className="flex items-center gap-2"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg">
        C
      </span>
      <span className="font-display text-xl">Cocinaris</span>
    </Link>
  );
}

function LangSwitch() {
  const { lang, setLang } = useStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="lang-switch"
          variant="ghost"
          size="sm"
          className="gap-1.5"
        >
          <Globe className="h-4 w-4" />{" "}
          {languages.find((l) => l.code === lang)?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            data-testid={`lang-opt-${l.code}`}
            onClick={() => setLang(l.code)}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useStore();
  const dark = theme === "dark";
  return (
    <Button
      data-testid="theme-toggle"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { tr, activity, scenarioError, smartAvailable } = useStore();
  const { enableScenarioBar } = useRuntime();
  const loc = useLocation();
  const inCookMode = loc.pathname.startsWith("/app/cozinhar");

  if (inCookMode) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
          <Brand />
          <div className="ml-auto flex items-center gap-1">
            <LangSwitch />
            <ThemeToggle />
            {/* Prototype ScenarioBar lives in the header — never as a fixed FAB over content. */}
            {enableScenarioBar ? <ScenarioBar /> : null}
            <Button asChild variant="ghost" size="icon">
              <Link to="/app/ajustes" data-testid="nav-settings">
                <SettingsIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {!smartAvailable && (
          <div
            data-testid="smart-offline-banner"
            className="border-t border-border bg-warning/15 px-4 py-2 text-center text-xs text-foreground/80 md:px-8"
          >
            {tr("states.offline")}
          </div>
        )}
        {scenarioError && (
          <div
            data-testid="scenario-error-banner"
            className="border-t border-border bg-destructive/15 px-4 py-2 text-center text-xs text-destructive md:px-8"
          >
            {scenarioError}
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 pb-32 pt-6 md:px-8 md:pb-10">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-24 hidden h-fit w-56 shrink-0 md:block">
          <nav className="flex flex-col gap-1">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  data-testid={`sidenav-${l.key}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {tr(`nav.${l.key}`)}
                </NavLink>
              );
            })}
          </nav>

          {activity && (
            <Link
              to={
                activity.type === "cook"
                  ? `/app/cozinhar/${activity.recipeId}`
                  : "/app/hoje"
              }
              data-testid="sidebar-activity"
              className="mt-6 block rounded-2xl border border-accent/30 bg-accent/10 p-3"
            >
              <p className="font-display text-sm">
                {activity.paused ? "Preparo pausado" : "Em andamento"}
              </p>
              <p className="text-xs text-muted-foreground">
                Toque para continuar
              </p>
            </Link>
          )}
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden safe-b">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={`bottomnav-${l.key}`}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${isActive ? "text-primary" : "text-muted-foreground"}`
                }
              >
                <Icon className="h-5 w-5" />
                {tr(`nav.${l.key}`)}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <Toaster />
    </div>
  );
}
