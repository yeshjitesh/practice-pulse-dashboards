import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, pageHead, breadcrumb } from "@/components/site/shared";
import { ContactSection } from "@/components/site/sections";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/contact", 'Contact PracticeMD — Talk to us about your practice dashboard', "Tell us about your GP practice, PCN or federation and what you'd like to see. We'll get back to you to discuss your custom dashboard."), scripts: [breadcrumb("/contact", "Contact")] }),
  component: ContactPage,
});

function ContactPage() {
  return <SiteShell><ContactSection as="h1" /></SiteShell>;
}
