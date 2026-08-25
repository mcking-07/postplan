# Diagrams & Illustrations

Inline SVG. Don't fall back to ASCII or "imagine a flowchart" prose.

## Flowchart / Architecture Diagram

- Inline SVG with labeled nodes, directional arrows, and a legend
- Happy path in a distinct color; failure/retry paths muted
- Abstract rare branches into a single subgraph — 40 nodes is unreadable
- Use shape and color together so it survives colorblind viewing

## Figure Sheet

- One figure per `<figure>` with a `<figcaption>`
- Consistent visual language across figures: same line weight, arrowhead style, palette
- Use `currentColor` for ink — adapts to dark mode

## SVG Rules

- `viewBox`, not fixed `width`/`height` — lets the figure scale
- `currentColor` for ink where possible
- Round numbers: `x="120"` not `x="119.7843"`
- Group with `<g>` and label for structure
- Text as `<text>`, not rendered paths — selectable, copyable, accessible

## Sketch

```html
<figure>
  <svg viewBox="0 0 600 200" role="img" aria-labelledby="title">
    <title id="title">Request lifecycle</title>
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
      </marker>
    </defs>
    <g>
      <rect x="20" y="80" width="120" height="40" rx="6" fill="none" stroke="currentColor"/>
      <text x="80" y="105" text-anchor="middle">ingress</text>
    </g>
    <line x1="140" y1="100" x2="180" y2="100" stroke="currentColor" marker-end="url(#arrow)"/>
    <g>
      <rect x="180" y="80" width="120" height="40" rx="6" fill="none" stroke="currentColor"/>
      <text x="240" y="105" text-anchor="middle">auth</text>
    </g>
  </svg>
  <figcaption>Happy-path request flow.</figcaption>
</figure>
```
