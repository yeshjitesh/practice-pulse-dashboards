<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Brand logo lives in src/components/brand/Logo.tsx (SVG using theme tokens); favicons/app icons in public/ are rendered from public/favicon.svg — keeps the brand in one place.
- Admin area: /admin under _authenticated (client-only gate); admin rights come from public.user_roles via has_role(); first signup auto-becomes admin via trigger. Public page content (testimonials, faqs) is read through a server fn with the publishable key.
- Sitemap is router-derived (src/lib/sitemap.ts + src/routes/sitemap[.]xml.ts); every route must set staticData.sitemap — keeps search listings in sync with pages.
- design/ holds the uploaded style reference (tokens.json, variables.css, theme_1.css, style-reference.md) as source material only; live tokens are in src/styles.css and DESIGN.md — keeps one source of truth for the running site.
- Public marketing pages share SiteShell (header/footer), pageHead() and breadcrumb() from src/components/site/shared.tsx and reusable sections from sections.tsx — each section page is its own route so it gets its own SEO head and sitemap entry.
