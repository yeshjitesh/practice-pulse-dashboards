import type { ReactNode } from "react";
import { Eyebrow, SiteShell } from "@/components/site/shared";

export const LEGAL_UPDATED = "27 November 2026";
export const CONTACT_EMAIL = "hello@practicemd.uk";

export function LegalPage({ eyebrow, title, intro, image, imageAlt, children }: { eyebrow: string; title: string; intro: string; image?: string; imageAlt?: string; children: ReactNode }) {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        {image && <img src={image} alt={imageAlt ?? ""} width={1024} height={768} className="mb-10 w-full rounded-xl border border-border animate-fade-up" />}
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-4xl text-primary md:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground">Last updated: {LEGAL_UPDATED}</p>
        <div className="mt-10 space-y-8 text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-primary [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6">
          {children}
        </div>
      </article>
    </SiteShell>
  );
}

export function legalSchema(path: string, name: string, description: string) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description,
      url: `https://practicemd.uk${path}`,
      inLanguage: "en-GB",
      dateModified: "2026-11-27",
      isPartOf: { "@type": "WebSite", name: "PracticeMD", url: "https://practicemd.uk/" },
      publisher: { "@type": "Organization", name: "PracticeMD", alternateName: "RotaCare UK", url: "https://practicemd.uk/", sameAs: ["https://rotacare.uk", "https://www.linkedin.com/company/rotacare-uk/"] },
    }),
  };
}
