# Use more of the screen width on desktop

Right now every section stops at about 1150px wide, so on large screens there is a lot of empty space on the left and right.

## What changes
- The header, footer and every section of the public pages (home, Features, How it works, FAQ, Contact) grow wider on large screens: about 1280px on laptops and up to about 1440px on big monitors.
- The side margins grow a little on wider screens so the content never touches the edge.
- Grids use the extra room: feature cards go to 4 per row on very wide screens, and the hero text and dashboard sample spread out more evenly.
- Text paragraphs keep a comfortable reading width, so long lines don't become hard to read.
- Phone and tablet layouts stay the same.

## Technical details
- In `shared.tsx`, `sections.tsx` and `index.tsx`, replace `max-w-6xl px-6` with `max-w-7xl 2xl:max-w-[90rem] px-6 lg:px-10`.
- Features grid: add `2xl:grid-cols-4`.
- Update the Layout line in DESIGN.md to match.
- Check at 1280, 1600 and 1920 widths and on a phone width with Playwright.
