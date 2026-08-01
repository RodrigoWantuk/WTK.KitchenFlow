import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { useStore } from "@/lib/store";
import { SCENARIOS } from "@/lib/mockData";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function ScenarioBar() {
  const { scenario, setScenario, tr } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          data-testid="scenario-open"
          className="fixed bottom-24 right-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-border bg-card shadow-lg md:bottom-6 md:right-6"
          aria-label={tr("scenarios.title")}
        >
          <FlaskConical className="h-5 w-5 text-accent" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">
            {tr("scenarios.title")}
          </SheetTitle>
        </SheetHeader>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Alterne cenários para ver como as telas respondem.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <Button
              key={s}
              data-testid={`scenario-${s}`}
              variant={scenario === s ? "default" : "outline"}
              onClick={() => {
                setScenario(s);
                setOpen(false);
              }}
              className="justify-start h-auto py-2.5 text-left text-sm"
            >
              {tr(`scenarios.list.${s}`)}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
