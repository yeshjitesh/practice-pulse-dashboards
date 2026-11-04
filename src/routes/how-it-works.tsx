import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, pageHead, breadcrumb } from "@/components/site/shared";
import { HowSection } from "@/components/site/sections";

export const Route = createFileRoute("/how-it-works")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/how-it-works", 'How it works — From first chat to live dashboard | PracticeMD', 'How PracticeMD builds your practice dashboard in three steps: talk to us, we design it with your team, then it goes live and keeps improving.'), scripts: [breadcrumb("/how-it-works", "How it works")] }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return <SiteShell><HowSection as="h1" /></SiteShell>;
}
