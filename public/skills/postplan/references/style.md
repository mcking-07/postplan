# Style

Default CSS baseline, layout classes, and anti-patterns. Read this before writing any HTML artifact.

## Rules

- Restraint over decoration. No gradients, no card-everything layouts.
- One element carries the document: the diagram, the comparison, or the timeline. Put the effort there. Everything around it stays quiet.
- Serif for prose. Sans-serif for tables and captions (the default CSS does this).
- Prose measure about 100 characters at 16px (46rem), 1.5 line height.
- Widths in `rem`, never `ch`. `ch` is the width of `0`, about 20% wider than average text, and it changes with every fallback font.
- Color carries meaning (severity, status, category), not mood. The four semantic tokens (`--accent`, `--ok`, `--warn`, `--danger`) are the whole palette. Add no colors beyond them.
- Status is never color alone. The word "Blocked" carries the meaning; red reinforces it.
- No animation. If a diagram needs it, wrap every animated rule in `@media (prefers-reduced-motion: no-preference)`.
- No em dashes anywhere, including sketches copied from these references.

## Layout

Everything is a direct child of `<body>`. No wrapper element. The default CSS caps prose at `--prose` (46rem). One class widens an element to `--wide` (80rem):

| Class         | Use for                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.wide`       | Comparison grids, multi-column status blocks, large diagrams, wide tables, code with long lines. A wide figure scrolls sideways on phones instead of shrinking; add `tabindex="0"` to it.                                       |
| `.columns`    | Responsive column grid. Columns are at least 16rem; they wrap by themselves. With `.wide`: 3 across from about 900px, 4 across from about 1200px, 2 on tablets, 1 on phones. Without `.wide`: 2 across from 600px, 1 on phones. |
| `.table-wrap` | Scroll container for tables with more than 4 columns. Combine with `.wide`.                                                                                                                                                     |
| `.timeline`   | Vertical timeline list: short timestamp (`14:02`) left, event right. Put the date in the heading.                                                                                                                               |

Nothing widens by itself. A `<pre>` with long lines or a `<figure>` with a large diagram needs `class="wide"`. Short code and small diagrams stay at prose width.

`.wide` works on direct children of `<body>` (or of `<main>`). An element nested inside a prose-width `<section>` cannot widen. Do not wrap the document in `<div>`s.

Tables with 4 columns or fewer need no class. Columns size to their content and long words wrap or hyphenate.

Tables with more than 4 columns go in `<div class="wide table-wrap" role="region" aria-label="..." tabindex="0">`. The table gets at least 44rem and scrolls sideways on phones instead of crushing. A 5-column table left without the wrapper falls back to `table-layout: fixed` so it cannot scroll the page, but its columns will be cramped.

Add `class="num"` to numeric cells for right alignment and tabular figures. Add `class="nowrap"` to cells that must not break, such as IDs and dates.

## Default CSS

Use when the user has not specified a style. Override any token when the content requires it. User-specified colors or domain palettes take precedence.

```css
:root {
  color-scheme: light dark;

  --bg:       #f7f7f5;
  --surface:  #ffffff;
  --ink:      #111115;
  --ink-soft: #5c5c66;
  --rule:     #c9c9c2;
  --accent:   #2563b0;
  --warn:     #92600a;
  --danger:   #b91c1c;
  --ok:       #1a7a35;

  --serif: Charter, "Iowan Old Style", "Palatino Linotype", Palatino, "Noto Serif", serif;
  --sans:  system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mono:  ui-monospace, Menlo, "Cascadia Code", Consolas, "Source Code Pro", "DejaVu Sans Mono", monospace;

  --prose: 46rem;
  --wide:  80rem;
  --gap:   clamp(1rem, 3vw, 2rem);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:       #111115;
    --surface:  #1a1a1f;
    --ink:      #d8d8dd;
    --ink-soft: #a8a8b2;
    --rule:     #3a3a44;
    --accent:   #7cb8f8;
    --warn:     #e6a700;
    --danger:   #f09696;
    --ok:       #79cf79;
  }
}

*, *::before, *::after { box-sizing: border-box; }
html { background: var(--bg); color: var(--ink); -webkit-text-size-adjust: 100%; }
body { margin: 0 auto; padding: clamp(2rem, 6vw, 4rem) var(--gap); max-width: calc(var(--wide) + 2 * var(--gap)); font: 1rem/1.55 var(--serif); }

h1, h2, h3, h4 { line-height: 1.2; text-wrap: balance; }
h1 { font-size: 2.2em; letter-spacing: -.01em; margin-top: 0; }
h2 { font-size: 1.4em; margin-top: 2.4em; }
h3 { font-size: 1.1em; margin-top: 2em; }
h4 { font-size: 1em; margin-top: 1.6em; }
p, li, dd, figcaption { text-wrap: pretty; overflow-wrap: break-word; hyphens: auto; }
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 2px; overflow-wrap: anywhere; }
hr { border: 0; border-top: 1px solid var(--rule); margin-block: 2.5rem; }
blockquote { padding-inline-start: 1rem; border-inline-start: 3px solid var(--rule); color: var(--ink-soft); }
img, svg { max-width: 100%; height: auto; }
figure { margin-block: 2rem; }
figure > svg { width: 100%; }
figcaption { max-width: var(--prose); margin: .5rem auto 0; font: .85em/1.5 var(--sans); color: var(--ink-soft); }
figure.wide { overflow-x: auto; }
figure.wide > svg { min-width: 48rem; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
:target { scroll-margin-block-start: 2rem; }

code, kbd, samp, pre { font-family: var(--mono); font-size: .92em; font-variant-ligatures: none; }
pre code, pre kbd, pre samp { font: inherit; }
:not(pre) > code { overflow-wrap: anywhere; }
pre { background: var(--surface); border: 1px solid var(--rule); border-radius: 4px; padding: 1rem 1.25rem; overflow-x: auto; line-height: 1.5; tab-size: 2; }
pre code { white-space: pre; }

table { border-collapse: collapse; width: 100%; font-family: var(--sans); font-size: .95em; }
caption { text-align: left; font-weight: 600; margin-bottom: .5rem; }
th, td { padding: .5rem clamp(.4rem, 1.5vw, .75rem); border-bottom: 1px solid var(--rule); text-align: left; vertical-align: top; overflow-wrap: break-word; hyphens: auto; }
thead th { border-bottom-width: 2px; }
:not(.table-wrap) > table:has(tr > :nth-child(5)) { table-layout: fixed; }
:not(.table-wrap) > table:has(tr > :nth-child(5)) :is(th, td) { overflow-wrap: anywhere; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }

.table-wrap { overflow-x: auto; }
.table-wrap > table { table-layout: auto; width: auto; min-width: max(100%, 44rem); }
.table-wrap .nowrap { white-space: nowrap; }

.columns { display: grid; gap: var(--gap); grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
.columns > * { min-width: 0; }

.timeline { list-style: none; padding: 0; }
.timeline > li { display: grid; grid-template-columns: 5.5em 1fr; gap: 0 1rem; padding-block: .6rem; border-top: 1px solid var(--rule); }
.timeline > li > :not(time) { grid-column: 2; margin: 0; }
.timeline time { font: .9em/1.8 var(--mono); color: var(--ink-soft); }

body > *, main > * { max-width: var(--prose); margin-inline: auto; }
main, .wide { max-width: none; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

@page { margin: 18mm; }

@media print {
  :root { color-scheme: light; --bg: #fff; --surface: #fff; --ink: #000; --ink-soft: #444; --rule: #bbb; --accent: #000; }
  body { padding: 0; max-width: none; }
  body > *, main > * { max-width: none; }
  pre, .table-wrap { overflow: visible; }
  pre, pre code { white-space: pre-wrap; overflow-wrap: anywhere; }
  .table-wrap > table { min-width: 100%; }
  figure, pre, tr, li { break-inside: avoid; }
  h1, h2, h3, h4 { break-after: avoid; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: .85em; color: var(--ink-soft); }
}
```

Every text token clears WCAG AA in both modes. Dark-mode `--ink-soft`, `--danger`, and `--ok` also meet APCA Lc 60, because WCAG 2.x overrates light-on-dark contrast. Do not darken them.

## Anti-Patterns

Restart if the artifact has any three of these:

- Cards everywhere with rounded corners and shadows on gray
- Full-bleed gradient hero
- Emoji as section headers
- Four shades of indigo doing nothing
- Glass morphism, frosted blur, animated backgrounds
- Centered everything
- A header with a logo placeholder
- Inline `style="display: grid"` instead of `.columns`
- A `<div class="container">` or `<main>` wrapper that swallows the prose measure
- A visual identity invented for this one document. Every PostPlan document looks like a PostPlan document; the content is what differs.
