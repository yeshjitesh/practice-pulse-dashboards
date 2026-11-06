import { createFileRoute } from "@tanstack/react-router";
import { pageHead, breadcrumb } from "@/components/site/shared";
import { legalSchema, LegalPage, CONTACT_EMAIL } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/privacy", "Privacy Policy | PracticeMD", "How PracticeMD collects, uses and protects your personal data under UK GDPR and the Data Protection Act 2018, and how to use your rights."), scripts: [legalSchema("/privacy", "Privacy Policy", "How PracticeMD collects, uses and protects your personal data under UK GDPR and the Data Protection Act 2018, and how to use your rights."), breadcrumb("/privacy", "Privacy Policy")] }),
  component: () => (
    <LegalPage eyebrow="Legal" title="Privacy Policy" intro="This policy explains how PracticeMD uses personal data, in line with the UK GDPR and the Data Protection Act 2018.">
      <section><h2>Who we are</h2><p>PracticeMD (practicemd.uk) is the data controller for personal data collected through this website. Contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p></section>
      <section><h2>What we collect</h2><ul><li>Details you send through our contact form: name, email, phone, job role, practice or organisation, list size, clinical system and your message.</li><li>Account details (email and sign-in information) for site administrators only.</li><li>Basic technical data such as browser type and IP address, used to keep the site secure.</li></ul><p>We do not ask for, and you should not send, patient information through this website.</p></section>
      <section><h2>Why we use it and our lawful basis</h2><ul><li>To reply to your enquiry and discuss our services — legitimate interests, or steps before entering a contract.</li><li>To run and secure the website — legitimate interests.</li><li>To meet legal obligations, such as keeping business records.</li></ul><p>We do not sell your data or use it for automated decision-making.</p></section>
      <section><h2>Who we share it with</h2><p>Only trusted service providers that host this website and its database, under contracts that protect your data. Some providers may process data outside the UK; where they do, appropriate safeguards such as the UK International Data Transfer Addendum are used.</p></section>
      <section><h2>How long we keep it</h2><p>Enquiries are kept for up to 24 months after our last contact, unless we start working together, in which case contract records are kept for 6 years.</p></section>
      <section><h2>Your rights</h2><p>You can ask to access, correct, delete or restrict your data, object to its use, or request a copy to take elsewhere. Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>; we reply within one month.</p><p>You can also complain to the Information Commissioner's Office at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">ico.org.uk</a> or on 0303 123 1113.</p></section>
      <section><h2>Changes</h2><p>We may update this policy; the date above shows the latest version.</p></section>
    </LegalPage>
  ),
});
