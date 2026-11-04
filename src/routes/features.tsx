import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, pageHead, breadcrumb } from "@/components/site/shared";
import { FeaturesSection } from "@/components/site/sections";

export const Route = createFileRoute("/features")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/features", 'Features — Practice dashboards for UK GP practices | PracticeMD', '15 example dashboards for UK GP practices and PCNs: QOF, Enhanced Services, CQC readiness, rotas, appointments, prescribing, finance and more.'), scripts: [breadcrumb("/features", "Features")] }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return <SiteShell><FeaturesSection as="h1" /></SiteShell>;
}
