import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { contentQuery } from "@/lib/content-query";
import { SiteShell, pageHead, breadcrumb } from "@/components/site/shared";
import { FaqSection } from "@/components/site/sections";

export const Route = createFileRoute("/faq")({
  staticData: { sitemap: true },
  head: ({ loaderData }) => {
    const faqs = ((loaderData as unknown as { faqs?: { question: string; answer: string }[] } | undefined)?.faqs) ?? [];
    const scripts = [breadcrumb("/faq", "FAQ")];
    if (faqs.length) scripts.push({ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((x) => ({ "@type": "Question", name: x.question, acceptedAnswer: { "@type": "Answer", text: x.answer } })) }) });
    return { ...pageHead("/faq", 'FAQ — Practice management dashboards explained | PracticeMD', 'Answers to common questions about PracticeMD custom dashboards for GP practices: what they are, how long they take and how your data is kept secure.'), scripts };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  component: FaqPage,
});

function FaqPage() {
  const { data } = useSuspenseQuery(contentQuery);
  return <SiteShell><FaqSection as="h1" faqs={data.faqs} /></SiteShell>;
}
