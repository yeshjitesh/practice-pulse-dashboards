import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead, breadcrumb } from "@/components/site/shared";
import drawing from "@/assets/cookies-drawing.jpg";
import { legalSchema, LegalPage } from "@/components/site/LegalPage";

const DESC = "The cookies, browser storage and visit statistics used on practicemd.uk, why we use them and how to manage your choice under UK PECR rules.";

export const Route = createFileRoute("/cookies")({
  staticData: { sitemap: true },
  head: () => ({ ...pageHead("/cookies", "Cookie Policy | PracticeMD", DESC), scripts: [legalSchema("/cookies", "Cookie Policy", DESC), breadcrumb("/cookies", "Cookie Policy")] }),
  component: () => (
    <LegalPage image={drawing} imageAlt="Drawing of a jar of cookies next to a browser window with a simple on/off switch" eyebrow="Legal" title="Cookie Policy" intro="This explains the cookies, browser storage and visit statistics used on practicemd.uk, under the Privacy and Electronic Communications Regulations (PECR).">
      <section><h2>Our approach</h2><p>We keep storage on your device to a minimum and never use advertising cookies. You can review your choice any time through "Cookie settings" in the footer.</p></section>
      <section><h2>Cookies and storage we use</h2><ul><li><strong>Hosting cookie</strong> — our hosting provider sets one strictly necessary cookie. It makes sure every page you load comes from the same version of the site. It holds no information about you and expires within 7 days.</li><li><strong>Your cookie choice</strong> — saved in your browser's local storage so we don't ask again. Strictly necessary.</li><li><strong>Chat reference</strong> — if you use the NEXA chat, a random reference is saved in your browser's local storage so your conversation can continue. Strictly necessary for the chat you asked to use.</li><li><strong>Sign-in storage</strong> — keeps site administrators signed in. Only set if you sign in. Strictly necessary.</li></ul></section>
      <section><h2>Visit statistics</h2><p>Our hosting provider records visit statistics for us: the pages visited, where visitors came from, their country, browser, operating system and device type, how long they stay, how fast pages load, errors, clicks, and actions on our demos, contact form and chat. This uses no cookies, stores nothing on your device, doesn't keep IP addresses and doesn't identify visitors. Lovable collects this data for us. <a href="https://lovable.dev/privacy" target="_blank" rel="noreferrer">Lovable's privacy policy</a> explains how it handles it. Detailed data is kept for 90 days and daily summaries for a year.</p><p>We record clicks and other actions for every visitor, unless your browser sends a Global Privacy Control signal. We count basic visit statistics for every visitor, whatever you choose on our cookie banner: pages visited, time on page, page speed and errors. This uses no cookies and doesn't identify you.</p></section>
      <section><h2>Third-party content</h2><p>Fonts are loaded from Google Fonts, which receives your IP address and browser details when a page loads. We do not embed advertising, social media trackers or video players.</p></section>
      <section><h2>Managing cookies and storage</h2><p>You can block or delete cookies and site data in your browser settings. Blocking strictly necessary storage may stop the chat, your saved choice or admin sign-in from working.</p></section>
      <section><h2>More information</h2><p>See our <Link to="/privacy">Privacy Policy</Link> and <Link to="/gdpr">UK GDPR</Link> page. If we add any other non-essential cookies, we will ask for your consent first and update this page.</p></section>
    </LegalPage>
  ),
});
