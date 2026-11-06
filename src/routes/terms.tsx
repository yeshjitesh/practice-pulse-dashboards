import { createFileRoute } from "@tanstack/react-router";
import { pageHead, breadcrumb } from "@/components/site/shared";
import { legalSchema, LegalPage, CONTACT_EMAIL } from "@/components/site/LegalPage";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/terms", "Terms of Use | PracticeMD", "The terms that apply when you use the PracticeMD website for GP practice dashboards, governed by the law of England and Wales."), scripts: [legalSchema("/terms", "Terms of Use", "The terms that apply when you use the PracticeMD website for GP practice dashboards, governed by the law of England and Wales."), breadcrumb("/terms", "Terms of Use")] }),
  component: () => (
    <LegalPage eyebrow="Legal" title="Terms of Use" intro="These terms apply to your use of practicemd.uk. By using the site you accept them.">
      <section><h2>About us</h2><p>This website is run by PracticeMD. Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p></section>
      <section><h2>Using the site</h2><ul><li>Use the site lawfully and don't try to disrupt or gain unauthorised access to it.</li><li>Don't send patient-identifiable or other confidential clinical information through our forms.</li></ul></section>
      <section><h2>Information on this site</h2><p>Content is general information about our services and is not professional, clinical or financial advice. Example dashboards and figures are illustrative.</p></section>
      <section><h2>Our services</h2><p>Any dashboard work is agreed in a separate written contract, which takes priority over these terms.</p></section>
      <section><h2>Intellectual property</h2><p>The site's content, design, logo and drawings belong to PracticeMD. You may view and share pages for personal or internal practice use, but not copy them for commercial use without permission.</p></section>
      <section><h2>Liability</h2><p>We work to keep the site accurate and available but can't guarantee it. We aren't liable for indirect losses from using the site. Nothing here limits liability that cannot be limited under English law, such as for death or personal injury caused by negligence, or fraud.</p></section>
      <section><h2>Links</h2><p>Links to other websites are for convenience; we aren't responsible for their content.</p></section>
      <section><h2>Law</h2><p>These terms are governed by the law of England and Wales, and its courts have jurisdiction.</p></section>
    </LegalPage>
  ),
});
