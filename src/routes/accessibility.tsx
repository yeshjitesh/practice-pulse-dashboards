import { createFileRoute } from "@tanstack/react-router";
import { pageHead, breadcrumb } from "@/components/site/shared";
import { LegalPage, CONTACT_EMAIL } from "@/components/site/LegalPage";

export const Route = createFileRoute("/accessibility")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/accessibility", "Accessibility Statement | PracticeMD", "How accessible the PracticeMD website is and how to report a problem."), scripts: [breadcrumb("/accessibility", "Accessibility")] }),
  component: () => (
    <LegalPage eyebrow="Legal" title="Accessibility Statement" intro="We want everyone, including people with disabilities, to be able to use this website.">
      <section><h2>Our aim</h2><p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 level AA. The site works on phones and desktops, supports keyboard navigation and screen readers, and uses readable colour contrast. Drawings have text descriptions.</p></section>
      <section><h2>Known issues</h2><p>We are not aware of any major problems, but we keep checking and improving.</p></section>
      <section><h2>Reporting a problem</h2><p>If something is hard to use, or you need information in another format, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We aim to reply within 5 working days.</p></section>
    </LegalPage>
  ),
});
