import type { Faq } from "@/components/site/sections";

const reportFaqs: Faq[] = [
  { id: "reports-live-connection", question: "Does PracticeMD connect to our live clinical system?", answer: "No. PracticeMD uses reports and files your practice chooses to provide or import. It does not connect to live NHS systems, EMIS Web or SystmOne. We agree the file format and import process with you first." },
  { id: "reports-format", question: "Can we start with the spreadsheets we already have?", answer: "Yes — tell us which reports you use and what you want to understand. CSV files and spreadsheets are a starting point; we review the columns and agree what your dashboard can use. There is no promise that every export will work unchanged." },
  { id: "reports-demo", question: "Can I try importing a report before getting in touch?", answer: "You can try a made-up sample report in our demos. It illustrates how figures could appear in your dashboard, not a real upload service. Please do not send patient records through the contact form or chat." },
  { id: "reports-governance", question: "Do imported reports still need data-protection checks?", answer: "Yes. Using files rather than a live connection does not remove your practice’s data-protection or information-governance responsibilities. We agree permissions, data minimisation and secure handling before any real data is shared." },
];

export function withImportFaqs(faqs: Faq[]): Faq[] {
  return [...reportFaqs, ...faqs.filter((f) => !reportFaqs.some((r) => r.question === f.question))];
}