# PracticeMD brand update

Note: the project currently has only the homepage with a contact form. There are no dashboard pages, sign-in or user roles yet, so the dashboard styling (part 5) applies through shared design tokens, ready for when dashboards are added.

## 1. Brand tokens
- Replace the current colours with: Forest Green #0B5D4E (primary), Teal #14B8A6 (accent), Mint #E6F5F1 (secondary/soft backgrounds), White, near-black green text, muted grey-green secondary text.
- Keep DM Serif Display for the wordmark and headlines, Fira Sans for body, forms and interface.
- Subtle borders, restrained shadows, rounded corners.

## 2. Logo assets (hand-drawn SVG, faithful to the reference)
- Icon: rounded "P" in forest green with the mint/teal flowing figure and head dot.
- Horizontal logo: icon + "Practice" (forest) "MD" (teal) + optional "PRACTICE MANAGEMENT DASHBOARDS" subtitle.
- Icon-only and white variants for dark backgrounds.
- Built as a small reusable logo component so it is crisp and lightweight.

## 3. Favicon and app icons
- Simplified icon on forest-green rounded square: favicon.svg plus PNGs at 16, 32, 48, Apple 180, and 192/512 app icons, rendered from the SVG.
- Web app manifest, theme colour #0B5D4E, updated title; remove the old default favicon.

## 4. Homepage styling
- Header with horizontal logo (icon-only on small phones), restyled buttons, links and hover states.
- Hero, benefit cards (mint band), form fields with teal focus ring, success/sending states, forest-green footer with white logo.
- Existing headline and wording kept. Mobile and desktop checked.

## 5. Verification
- Screenshots at mobile and desktop, check favicon files load, no console errors, contact form still submits.
- Report changed files and note that a professionally exported vector logo from the original designer would be the definitive asset.

## Technical details
- Files: src/styles.css, src/components/brand/Logo.tsx, src/routes/__root.tsx (icons, manifest, theme-color), src/routes/index.tsx, public/favicon.svg, public/*.png, public/site.webmanifest; delete public/favicon.ico.
- PNGs generated from the SVG with ImageMagick/rsvg.
