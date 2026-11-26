import { ChatWidget } from "@/components/chat/ChatWidget";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { CookieBanner, openCookieSettings } from "@/components/site/CookieBanner";

export const btn = "inline-flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90";
export const btnNavy = "inline-flex items-center justify-center rounded-full bg-navy font-medium text-navy-foreground transition-colors hover:bg-navy/90";

export function Eyebrow({ children, dot = "bg-accent" }: { children: string; dot?: string }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-primary">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {children}
    </p>
  );
}

export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("is-visible"), io.unobserve(e.target))),
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const navLink = "text-muted-foreground transition-colors hover:text-primary";
const navActive = { className: "text-primary font-medium" };

export function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useReveal();
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl 2xl:max-w-[90rem] items-center justify-between px-6 lg:px-10 py-4">
          <Link to="/" aria-label="PracticeMD home"><Logo subtitle /></Link>
          <nav aria-label="Main navigation" className="flex items-center gap-3 md:gap-6 text-sm">
            <Link to="/features" className={`hidden md:inline ${navLink}`} activeProps={navActive}>Features</Link>
            <Link to="/demos" className={`hidden md:inline ${navLink}`} activeProps={navActive}>Demos</Link>
            <Link to="/how-it-works" className={`hidden md:inline ${navLink}`} activeProps={navActive}>How it works</Link>
            <Link to="/faq" className={`hidden md:inline ${navLink}`} activeProps={navActive}>FAQ</Link>
            <Link to="/about" className={`hidden md:inline ${navLink}`} activeProps={navActive}>About</Link>
            <Button asChild variant="brand" className="hidden sm:inline-flex"><Link to="/contact">Get in touch</Link></Button>
            <Button variant="ghost" size="icon" className="md:hidden text-primary" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
          </nav>
        </div>
        {menuOpen && <nav id="mobile-navigation" aria-label="Mobile navigation" className="grid gap-1 border-t border-border bg-background px-6 py-4 md:hidden">
          <Link to="/features" onClick={() => setMenuOpen(false)} className="py-3 text-primary">Features</Link>
          <Link to="/demos" onClick={() => setMenuOpen(false)} className="py-3 text-primary">Demos</Link>
          <Link to="/how-it-works" onClick={() => setMenuOpen(false)} className="py-3 text-primary">How it works</Link>
          <Link to="/faq" onClick={() => setMenuOpen(false)} className="py-3 text-primary">FAQ</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} className="py-3 text-primary">About</Link>
          <Button asChild variant="brand" className="mt-2"><Link to="/contact" onClick={() => setMenuOpen(false)}>Get in touch</Link></Button>
        </nav>}
      </header>
      <main>{children}</main>
      <ChatWidget />
      <CookieBanner />
      <footer className="bg-primary py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl 2xl:max-w-[90rem] flex-col items-center justify-between gap-6 px-6 lg:px-10 md:flex-row">
          <Logo variant="white" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/80">
            <Link to="/features" className="hover:text-primary-foreground">Features</Link>
            <Link to="/demos" className="hover:text-primary-foreground">Demos</Link>
            <Link to="/how-it-works" className="hover:text-primary-foreground">How it works</Link>
            <Link to="/faq" className="hover:text-primary-foreground">FAQ</Link>
            <Link to="/about" className="hover:text-primary-foreground">About</Link>
            <Link to="/contact" className="hover:text-primary-foreground">Contact</Link>
            <Link to="/privacy" className="hover:text-primary-foreground">Privacy</Link>
            <Link to="/cookies" className="hover:text-primary-foreground">Cookies</Link>
            <Link to="/terms" className="hover:text-primary-foreground">Terms</Link>
            <Link to="/accessibility" className="hover:text-primary-foreground">Accessibility</Link>
            <button type="button" onClick={openCookieSettings} className="hover:text-primary-foreground">Cookie settings</button>
          </nav>
          <div className="text-center text-sm text-primary-foreground/80 md:text-right"><p>© {new Date().getFullYear()} PracticeMD · practicemd.uk</p><p className="mt-1 text-xs text-primary-foreground/70">Formerly known as RotaCare UK (<a href="https://rotacare.uk" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary-foreground">rotacare.uk</a>)</p></div>
        </div>
      </footer>
    </div>
  );
}

const SITE = "https://practicemd.uk";
const OG = `${SITE}/og-image.jpg`;
export function pageHead(path: string, title: string, description: string) {
  const url = `${SITE}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_GB" },
      { property: "og:url", content: url },
      { property: "og:image", content: OG },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function breadcrumb(path: string, name: string) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name, item: `${SITE}${path}` },
      ],
    }),
  };
}
