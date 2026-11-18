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
- Admin area uses a server-validated shared-code gate and encrypted HttpOnly session; every read and mutation verifies the gate before privileged access, and signup never grants admin privileges. Public page content uses a publishable-key server function — keeps private records off public clients.
- Sitemap is router-derived (src/lib/sitemap.ts + src/routes/sitemap[.]xml.ts); every route must set staticData.sitemap — keeps search listings in sync with pages.
- src/design/ holds the uploaded style reference (tokens.json, variables.css, theme_1.css, style-reference.md) as source material only; live tokens are in src/styles.css and DESIGN.md — keeps one source of truth for the running site.
- Public marketing pages share SiteShell (header/footer), pageHead() and breadcrumb() from src/components/site/shared.tsx and reusable sections from sections.tsx — each section page is its own route so it gets its own SEO head and sitemap entry.
- The SiteShell wrapper clips horizontal overflow with overflow-x-clip, never overflow-x-hidden — a hidden/auto overflow on that ancestor turns it into a scroll container and silently breaks position: sticky (e.g. the pinned contact column).
- The homepage uses a concise overview and selected demos rather than repeating the full feature catalogue; detailed coverage stays on the dedicated pages to keep the enquiry journey focused.
- Admin dashboard sections live in src/components/admin/ and share one cached admin-data query; enquiry filtering, counts and CSV export are pure helpers in src/lib/admin-insights.ts — keeps the route thin and the rules testable.

- Demo report imports use shared synthetic fixtures and a client-only one-second simulation; no file picker or upload endpoint is exposed — keeps marketing demos separate from real clinical data handling.
- Import-workflow FAQs are composed identically into public FAQ views and their structured data — keeps visible answers and search metadata consistent without changing admin-managed content.
