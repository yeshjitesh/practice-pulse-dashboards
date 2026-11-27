import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead, breadcrumb } from "@/components/site/shared";
import drawing from "@/assets/privacy-drawing.jpg";
import { legalSchema, LegalPage, CONTACT_EMAIL } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/privacy", "Privacy Policy | PracticeMD", "How PracticeMD collects, uses and protects your personal data under UK GDPR and the Data Protection Act 2018, and how to use your rights."), scripts: [legalSchema("/privacy", "Privacy Policy", "How PracticeMD collects, uses and protects your personal data under UK GDPR and the Data Protection Act 2018, and how to use your rights."), breadcrumb("/privacy", "Privacy Policy")] }),
  component: () => (
    <LegalPage image={drawing} imageAlt="Drawing of a smiling padlock and shield protecting a folder of documents" eyebrow="Legal" title="Privacy Policy" intro="This policy explains how PracticeMD uses personal data, in line with the UK GDPR and the Data Protection Act 2018.">
      <section><h2>Who we are</h2><p>PracticeMD (practicemd.uk) is the data controller for personal data collected through this website. Contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p></section>
      <section><h2>What we collect</h2><ul><li>Details you send through our contact form: name, email, phone, job role, practice or organisation, list size, clinical system and your message.</li><li>Messages you type into the NEXA chat, and any contact details you share there.</li><li>Account details (email and sign-in information) for site administrators only.</li><li>Visit statistics about how the site is used, which do not identify you (see our <Link to="/cookies">Cookie Policy</Link>).</li></ul><p>We do not ask for, and you must not send, patient information or health data through this website.</p></section>
      <section><h2>Why we use it and our lawful basis</h2><ul><li>To reply to your enquiry or chat and discuss our services — legitimate interests, or steps you ask us to take before a contract.</li><li>To run, secure and improve the website — legitimate interests.</li><li>To provide services under a contract — performance of a contract.</li><li>To meet legal obligations, such as keeping business and tax records.</li></ul><p>We do not sell your data or make decisions about you using solely automated processing.</p></section>
      <section><h2>Who we share it with</h2><p>Only service providers we need: website hosting and visit statistics, our database provider, the AI provider that generates chat replies, and Google Fonts. Each acts under contract and may only use data to provide its service. We would also disclose data if required by law. Some providers may process data outside the UK; where they do, we rely on UK adequacy regulations or safeguards such as the UK International Data Transfer Agreement or Addendum.</p></section>
      <section><h2>Practice-supplied reports</h2><p>If your organisation provides reports for a dashboard, your organisation remains the data controller and we act as its processor under a written data processing agreement. See our <Link to="/gdpr">UK GDPR</Link> page.</p></section>
      <section><h2>How long we keep it</h2><p>Enquiries and chat conversations are kept for up to 24 months after our last contact. If we work together, contract and financial records are kept for 6 years.</p></section>
      <section><h2>Security</h2><p>We use encrypted connections, restricted admin access and access controls on our database. No website is completely secure, so please send only the information we need.</p></section>
      <section><h2>Your rights</h2><p>You can ask to access, correct, delete or restrict your data, object to its use, or request a copy to take elsewhere. Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>; we reply within one month.</p><p>You can also complain to the Information Commissioner's Office at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">ico.org.uk</a> or on 0303 123 1113.</p></section>
      <section><h2>Changes</h2><p>We may update this policy; the date above shows the latest version.</p></section>
    </LegalPage>
  ),
});
