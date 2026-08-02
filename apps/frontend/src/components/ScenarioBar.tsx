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

/**
 * Prototype-only scenario switcher.
 * Rendered in the sticky header (not a fixed overlay) so it cannot intercept
 * pointer hit-testing on pantry cards or Cook CTAs under Firefox native zoom,
 * when the layout viewport falls below the `md` breakpoint.
 */
export default function ScenarioBar() {
  const { scenario, setScenario, tr } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          data-testid="scenario-open"
          variant="ghost"
          size="icon"
          aria-label={tr("scenarios.title")}
        >
          <FlaskConical className="h-4 w-4 text-accent" />
        </Button>
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
