import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { withImportFaqs } from "@/lib/import-faqs";
import { contentQuery } from "@/lib/content-query";
import { SiteShell, pageHead, breadcrumb } from "@/components/site/shared";
import { FaqSection, type Faq } from "@/components/site/sections";

export const Route = createFileRoute("/faq")({
  staticData: { sitemap: true },
  head: ({ loaderData }) => {
    const content = loaderData as unknown as { faqs?: Faq[] } | undefined;
    const faqs = withImportFaqs(content?.faqs ?? []);
    const scripts = [breadcrumb("/faq", "FAQ")];
    if (faqs.length) scripts.push({ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((x) => ({ "@type": "Question", name: x.question, acceptedAnswer: { "@type": "Answer", text: x.answer } })) }) });
    return { ...pageHead("/faq", 'GP Practice Dashboard FAQs | PracticeMD', 'Plain answers about practice-provided reports, CSV imports, sample demos and data protection. PracticeMD does not connect to live NHS systems.'), scripts };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  component: FaqPage,
});

function FaqPage() {
  const { data } = useSuspenseQuery(contentQuery);
  return <SiteShell><FaqSection as="h1" faqs={withImportFaqs(data.faqs)} /></SiteShell>;
}
