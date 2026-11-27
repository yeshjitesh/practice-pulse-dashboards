import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, pageHead, breadcrumb } from "@/components/site/shared";
import { FeaturesSection } from "@/components/site/sections";

export const Route = createFileRoute("/features")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/features", 'QOF, CQC & Staffing Dashboard Features | PracticeMD', 'Bespoke GP practice dashboards from your EMIS Web or SystmOne exports: QOF, appointments, CQC readiness, staffing and finance. No live NHS connection.'), scripts: [breadcrumb("/features", "Features")] }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return <SiteShell><FeaturesSection as="h1" /></SiteShell>;
}
