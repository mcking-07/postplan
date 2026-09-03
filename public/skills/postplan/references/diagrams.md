# Diagrams & Illustrations

Inline SVG. Do not fall back to ASCII or "imagine a flowchart" prose.

## Flowchart or Architecture Diagram

- Inline SVG with labeled nodes, directional arrows, and a legend
- Happy path in `--accent`; failure and retry paths in `--ink-soft`
- Abstract rare branches into a single subgraph. 40 nodes is unreadable.
- Use shape and color together so it survives colorblind viewing
- Prefer tall layouts over wide ones. A diagram that flows top to bottom survives a phone; one that flows left to right does not.

## Figure Sheet

- One figure per `<figure>` with a `<figcaption>` that states what the reader should take from it
- Consistent visual language across figures: same line weight, arrowhead style, and palette

## Sizing

Browsers size SVG text in viewBox units, so the ratio of viewBox width to rendered width scales every label. Match the viewBox to the width the figure will render at, and the labels come out at their nominal size.

- Prose-width figure (default): renders at 736px on desktop. viewBox width 600 to 750, `font-size` 15 or 16. On a 360px phone the labels shrink to about 7px; keep phone-critical diagrams at viewBox width 400 or stack the nodes vertically.
- `<figure class="wide" tabindex="0">`: renders at up to 1280px on desktop and scrolls sideways on phones at 768px. viewBox width 1000 to 1200, `font-size` 14 to 16. A 900-unit viewBox in a wide figure renders labels at 21px, larger than body text.
- Wider than 1200 units: split the diagram.
- Keep the aspect ratio under 3:1.
- Leave at least 40 units of empty space inside every edge of the viewBox. Row labels, legends, and storage nodes near the border get clipped or overlap the first column.

## SVG Rules

- `viewBox`, no `width` or `height` attributes. The default CSS sets `figure > svg { width: 100% }`.
- `fill="currentColor"` and `stroke="currentColor"` on the `<svg>` root. Text and strokes inherit both and follow dark mode. Set `fill="none"` on shapes that should be outlines.
- Explicit `font-size` on the root; do not rely on the body size (17 units is too large in small viewBoxes and too small in big ones).
- Unique ids per figure (`fig1-title`, `fig1-arrow`). Ids are document-global; a second copy of the sketch with the same ids gets the first figure's title and markers.
- `role="img"` on the svg plus `aria-labelledby` pointing at the `<title>`. Screen readers do not read `<text>` inside `role="img"`, so the `<figcaption>` must carry the meaning.
- Round numbers: `x="120"` not `x="119.7843"`
- Group with `<g>` for structure
- Text as `<text>`, not rendered paths

## Sketch

```html
<figure>
  <svg viewBox="0 0 700 120" role="img" aria-labelledby="fig1-title" fill="currentColor" stroke="currentColor" font-size="15" font-family="system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <title id="fig1-title">What the diagram shows, as one sentence</title>
    <defs>
      <marker id="fig1-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" stroke="none"/>
      </marker>
    </defs>
    <g>
      <rect x="20" y="40" width="120" height="40" rx="6" fill="none"/>
      <text x="80" y="65" text-anchor="middle" stroke="none">client</text>
    </g>
    <line x1="140" y1="60" x2="180" y2="60" marker-end="url(#fig1-arrow)"/>
    <g>
      <rect x="180" y="40" width="120" height="40" rx="6" fill="none"/>
      <text x="240" y="65" text-anchor="middle" stroke="none">service</text>
    </g>
    <line x1="300" y1="60" x2="340" y2="60" marker-end="url(#fig1-arrow)"/>
    <g>
      <rect x="340" y="40" width="120" height="40" rx="6" fill="none"/>
      <text x="400" y="65" text-anchor="middle" stroke="none">worker</text>
    </g>
    <line x1="460" y1="60" x2="500" y2="60" marker-end="url(#fig1-arrow)"/>
    <g>
      <rect x="500" y="30" width="80" height="60" rx="30" fill="none" stroke-dasharray="4"/>
      <text x="540" y="65" text-anchor="middle" stroke="none">store</text>
    </g>
  </svg>
  <figcaption>What the reader should take from the diagram, one sentence.</figcaption>
</figure>
```

For a larger diagram, `<figure class="wide" tabindex="0">` with a viewBox 1000 to 1200 wide. Same rules.
