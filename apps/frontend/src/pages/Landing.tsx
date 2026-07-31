import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { languages } from "@/lib/i18n";

export default function Landing() {
  const { tr, lang, setLang, setAuthed } = useStore();
  const steps = tr("landing.steps") as any; // i18n nested arrays not reflected in tr(): string
  const benefits = tr("landing.benefits") as any;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg">
            C
          </span>
          <span className="font-display text-2xl">Cocinaris</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden gap-1 sm:flex">
            {languages.map((l) => (
              <button
                key={l.code}
                data-testid={`landing-lang-${l.code}`}
                onClick={() => setLang(l.code)}
                className={`rounded-full px-3 py-1 text-xs ${lang === l.code ? "bg-secondary" : "text-muted-foreground"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Link to="/acesso" data-testid="landing-enter">
            <Button size="sm" className="rounded-full">
              {tr("ctaEnter")} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-10 pt-6 md:grid-cols-2 md:gap-16 md:px-10 md:py-16">
        <div className="flex flex-col justify-center">
          <span className="pill mb-4 border border-border bg-secondary/60 text-foreground/80 w-fit">
            <Leaf className="h-3.5 w-3.5 text-primary" /> Cozinhar de verdade,
            todo dia
          </span>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            {tr("tagline")}
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
            {tr("heroSub")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/acesso" data-testid="hero-enter">
              <Button size="lg" className="rounded-full px-6">
                {tr("ctaEnter")}
              </Button>
            </Link>
            <button
              data-testid="hero-demo"
              onClick={() => {
                setAuthed(true);
                window.location.href = "/app/hoje";
              }}
              className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-secondary/60"
            >
              {tr("ctaTryDemo")}
            </button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-border grain">
            <img
              src="https://images.unsplash.com/photo-1636647511729-6703539ba71f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBjb29raW5nJTIwa2l0Y2hlbiUyMHdhcm0lMjBsaWdodHxlbnwwfHx8fDE3ODU1MTg2NDh8MA&ixlib=rb-4.1.0&q=85"
              alt="Cozinha aconchegante"
              className="h-[420px] w-full object-cover md:h-[520px]"
            />
          </div>
          <div className="absolute -bottom-4 left-6 max-w-[280px] rounded-2xl border border-border bg-card p-4 shadow-lg">
            <p className="font-display text-sm">Hoje faz sentido cozinhar…</p>
            <p className="text-xs text-muted-foreground">
              "Omelete verde" — usa espinafre que está pedindo atenção.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <h2 className="font-display text-3xl md:text-4xl">
          {tr("landing.how")}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s: any, i: number) => (
            <div
              key={i}
              data-testid={`landing-step-${i}`}
              className="rounded-2xl border border-border bg-card p-6 card-hover"
            >
              <span className="pill bg-secondary/60 text-foreground/80">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <div className="grid gap-8 rounded-3xl border border-border bg-secondary/40 p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">
              {tr("landing.benefitsTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sem culpa, sem gamificação, sem virar dashboard.
            </p>
          </div>
          <ul className="space-y-3">
            {benefits.map((b: any, i: number) => (
              <li key={i} className="flex gap-3 text-base">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-muted-foreground md:px-10">
        {tr("landing.footer")}
      </footer>
    </div>
  );
}
