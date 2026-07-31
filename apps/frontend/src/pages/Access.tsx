import { useNavigate, Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useRuntime } from "@/app/runtime/RuntimeProvider";
import { useSession } from "@/app/session/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { FeatureUnavailable } from "@/components/runtime/FeatureUnavailable";

export default function Access() {
  const { tr, setAuthed } = useStore();
  const { enablePrototypeFixtures, persistPrototypeAuth } = useRuntime();
  const { beginLogin, session } = useSession();
  const nav = useNavigate();

  if (!enablePrototypeFixtures) {
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

  const enter = () => {
    beginLogin("/app/hoje");
    if (persistPrototypeAuth) setAuthed(true);
    nav("/app/hoje");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-5xl gap-0 md:grid-cols-2">
        <div className="hidden md:block relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1744104135578-6768f2061be1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGluZ3JlZGllbnRzJTIwcGFudHJ5JTIwcnVzdGljfGVufDB8fHx8MTc4NTUxODY0OHww&ixlib=rb-4.1.0&q=85"
            className="absolute inset-0 h-full w-full object-cover"
            alt="ingredientes"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/70 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-10">
            <span className="font-display text-3xl text-foreground">
              Cocinaris
            </span>
            <p className="mt-2 max-w-xs text-sm text-foreground/80">
              {tr("tagline")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-3xl md:text-4xl">
              {tr("access.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {tr("access.sub")}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                enter();
              }}
              className="mt-8 space-y-4"
            >
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="access-email"
                  defaultValue="marina@cocinaris.dev"
                />
              </div>
              <div>
                <Label htmlFor="pw">Senha</Label>
                <Input
                  id="pw"
                  type="password"
                  data-testid="access-password"
                  defaultValue="demo-only"
                />
              </div>
              <Button
                type="submit"
                data-testid="access-enter"
                className="w-full rounded-full"
              >
                {tr("access.enter")}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> {tr("common.or")}{" "}
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              variant="outline"
              data-testid="access-demo"
              className="w-full rounded-full"
              onClick={enter}
            >
              {tr("access.demo")}
            </Button>

            <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5" /> {tr("access.why")}
            </p>
            <Link
              to="/"
              className="mt-6 block text-center text-xs text-muted-foreground underline underline-offset-4"
            >
              {tr("common.back")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
