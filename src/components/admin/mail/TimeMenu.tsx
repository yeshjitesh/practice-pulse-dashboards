import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quickTimes } from "@/lib/mail-utils";
import { toLocalInput, whenLabel } from "./api";

/** Quick time picks plus a "pick date & time" dialog. Used by Snooze and Schedule send. */
export function TimeMenu({ label, heading, confirmLabel, triggerClassName, children, validate, onPick }: {
  label: string; heading: string; confirmLabel: string; triggerClassName: string; children: React.ReactNode;
  validate: (d: Date) => string | null; onPick: (d: Date) => void;
}) {
  const [custom, setCustom] = useState(false);
  const [value, setValue] = useState("");
  const options = quickTimes().filter((o) => !validate(o.at));
  const chosen = value ? new Date(value) : null;
  const problem = chosen ? validate(chosen) : null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger title={label} aria-label={label} className={triggerClassName}>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuLabel>{heading}</DropdownMenuLabel>
          {options.map((o) => (
            <DropdownMenuItem key={o.label} onSelect={() => onPick(o.at)} className="justify-between gap-4">
              <span>{o.label}</span><span className="text-xs text-muted-foreground">{whenLabel(o.at)}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => { setValue(toLocalInput(new Date(Date.now() + 86400_000))); setCustom(true); }}>
            <CalendarClock /> Pick date &amp; time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={custom} onOpenChange={setCustom}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">{heading}</DialogTitle>
            <DialogDescription>Times are in your local time zone.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (chosen && !problem) { onPick(chosen); setCustom(false); } }}>
            <input type="datetime-local" aria-label="Date and time" value={value} onChange={(e) => setValue(e.target.value)} min={toLocalInput(new Date())}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-hidden focus:border-accent" />
            {problem && <p className="text-sm text-destructive">{problem}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCustom(false)}>Cancel</Button>
              <Button type="submit" disabled={!chosen || !!problem}>{confirmLabel}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
