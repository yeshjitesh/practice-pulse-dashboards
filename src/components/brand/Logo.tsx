import { cn } from "@/lib/utils";

type Variant = "color" | "white";

export function LogoIcon({ className, variant = "color" }: { className?: string; variant?: Variant }) {
  const white = variant === "white";
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="PracticeMD">
      <path d="M8 14a10 10 0 0 1 10-10h16a20 20 0 0 1 0 40h-8L8 58z" className={white ? "fill-primary-foreground" : "fill-primary"} />
      <path d="M7 61c2-15 13-25 33-31-7 10-17 16-24 30z" className="fill-accent" />
      <circle cx="34" cy="22" r="5.5" className={white ? "fill-primary" : "fill-primary-foreground"} />
    </svg>
  );
}

export function Logo({ className, variant = "color", subtitle = false, iconOnlyOnMobile = false }: { className?: string; variant?: Variant; subtitle?: boolean; iconOnlyOnMobile?: boolean }) {
  const white = variant === "white";
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoIcon variant={variant} className="h-10 w-10 shrink-0" />
      <span className={cn("flex flex-col leading-none", iconOnlyOnMobile && "hidden sm:flex")}>
        <span className={cn("font-display text-2xl", white ? "text-primary-foreground" : "text-primary")}>
          Practice<span className="text-accent">MD</span>
        </span>
        {subtitle && (
          <span className={cn("mt-1 text-[0.55rem] font-medium uppercase tracking-[0.25em]", white ? "text-primary-foreground/80" : "text-primary")}>
            Practice Management Dashboards
          </span>
        )}
      </span>
    </span>
  );
}
