import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, pageHead, breadcrumb } from "@/components/site/shared";
import { ImportSteps } from "@/components/site/ImportSteps";
import { HowSection } from "@/components/site/sections";

export const Route = createFileRoute("/how-it-works")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/how-it-works", 'How it works — From first chat to live dashboard | PracticeMD', 'See how PracticeMD turns practice-provided reports into clear dashboards: agree your file format, plan secure imports and get support. No live NHS connection.'), scripts: [breadcrumb("/how-it-works", "How it works")] }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return <SiteShell><HowSection as="h1" /><ImportSteps /></SiteShell>;
}
