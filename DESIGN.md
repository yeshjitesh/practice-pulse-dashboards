# PracticeMD design guide

All values live as tokens in `src/styles.css`; components use token classes only (`bg-primary`, `text-blush-foreground`), never raw colours.

## Colour
| Token | Value | Use |
|---|---|---|
| primary | #0B5D4E forest | brand, main buttons, headings, footer |
| accent / ring | #14B8A6 teal | "MD", highlights, focus rings, chart bars |
| secondary | #E6F5F1 mint | section fills, cards |
| background | #fffdf8 cream | page |
| navy | #16325a | secondary button ("Explore features") |
| blush / blush-foreground | #f2e8e2 / #7a3f57 | strips, alternate sections and cards |
| rose | #d6aec1 | dividers, label dots |
| sage / peach / sky | #DCFCE7 / #FFEDD5 / #DBEAFE | benefit cards, tags, KPI tiles |

Never recolour the logo (`src/components/brand/Logo.tsx`).

## Type
- Display: DM Serif Display — wordmark, headlines.
- Body/UI: Fira Sans — text, forms, nav, tables.
- Labels: IBM Plex Mono, uppercase, 0.06em tracking, with a coloured dot.

## Shape and surfaces
- Flat cards: 1px border, no shadow, rounded-2xl; fills alternate mint / blush / white.
- Buttons: pill (rounded-full). Primary = forest, secondary = navy.
- Tags on a filled card must use a contrasting fill (white tag on blush card).
- Illustrations: hand-drawn style drawings, not photos.

## Layout
- Container max-w-6xl, px-6; sections py-20 to py-28.
- Phones: buttons stack full width; strips become 2×2 grids; decorative drawings may hide.
- Motion: gentle fade-up on scroll only, disabled for reduced motion.
