import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, pageHead, breadcrumb } from "@/components/site/shared";
import { FeaturesSection } from "@/components/site/sections";

export const Route = createFileRoute("/features")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/features", 'Features — Practice dashboards for UK GP practices | PracticeMD', 'Explore bespoke GP practice dashboards built around your supplied reports: QOF, appointments, staffing and finance. No live NHS connection.'), scripts: [breadcrumb("/features", "Features")] }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return <SiteShell><FeaturesSection as="h1" /></SiteShell>;
}
