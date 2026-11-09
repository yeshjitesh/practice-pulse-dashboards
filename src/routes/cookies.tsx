import { createFileRoute } from "@tanstack/react-router";
import { pageHead, breadcrumb } from "@/components/site/shared";
import drawing from "@/assets/cookies-drawing.jpg";
import { legalSchema, LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/cookies")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/cookies", "Cookie Policy | PracticeMD", "Which cookies and similar storage the PracticeMD website uses, why they are strictly necessary, and how to manage them under UK PECR rules."), scripts: [legalSchema("/cookies", "Cookie Policy", "Which cookies and similar storage the PracticeMD website uses, why they are strictly necessary, and how to manage them under UK PECR rules."), breadcrumb("/cookies", "Cookie Policy")] }),
  component: () => (
    <LegalPage image={drawing} imageAlt="Drawing of a jar of cookies next to a browser window with a simple on/off switch" eyebrow="Legal" title="Cookie Policy" intro="This explains the cookies and similar technologies used on practicemd.uk, under the Privacy and Electronic Communications Regulations (PECR).">
      <section><h2>Our approach</h2><p>We use strictly necessary storage so the website works. With your consent we also count anonymous visits (which pages and demos are used) — never names, emails or messages. We never use advertising cookies. You can change your choice any time via "Cookie settings" in the footer.</p></section>
      <section><h2>What we use</h2><ul><li><strong>Sign-in storage</strong> — keeps site administrators signed in. Only set if you sign in. Strictly necessary.</li><li><strong>Security</strong> — our hosting provider may set short-lived technical data to protect the site from abuse. Strictly necessary.</li></ul></section>
      <section><h2>Managing cookies</h2><p>You can block or delete cookies in your browser settings. Blocking strictly necessary storage may stop sign-in from working.</p></section>
      <section><h2>Changes</h2><p>If we add any other non-essential cookies, we will ask for your consent first and update this page.</p></section>
    </LegalPage>
  ),
});
