# Style

Default CSS baseline and anti-patterns. Read this before writing any HTML artifact.

## Rules

- Restraint over decoration — no gradients, no card-everything layouts
- Serif for documents and explainers, sans-serif for dense tables and data
- 16–18px body, 60–75ch line length, 1.5–1.6 line height
- Color carries meaning (severity, status, category), not mood
- Two accent colors maximum

## Default CSS

Use when the user hasn't specified a style. Override any token when the content requires it — different document types, user-specified colors, or domain-specific palettes take precedence.

```css
:root {
  --bg:       #f7f7f5;
  --surface:  #ffffff;
  --ink:      #111115;
  --ink-soft: #66666e;
  --rule:     #ddddd8;
  --accent:   #2563b0;
  --warn:     #92600a;
  --danger:   #b91c1c;
  --ok:       #1a7a35;

  --serif: Charter, "Iowan Old Style", "Source Serif 4", ui-serif, Georgia, serif;
  --sans:  ui-sans-serif, system-ui, -apple-system, sans-serif;
  --mono:  'SF Mono', ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:       #111115;
    --surface:  #1a1a1f;
    --ink:      #d8d8dd;
    --ink-soft: #888890;
    --rule:     #2a2a30;
    --accent:   #7cb8f8;
    --warn:     #e6a700;
    --danger:   #e87070;
    --ok:       #5bb55b;
  }
}

html { background: var(--bg); color: var(--ink); }
body { font: 17px/1.55 var(--serif); max-width: 70ch; margin: 4rem auto; padding: 0 1.25rem; }
h1 { font-size: 2.2rem; line-height: 1.15; letter-spacing: -.01em; }
h2 { font-size: 1.4rem; margin-top: 2.4em; }
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 2px; }
code, pre { font-family: var(--mono); font-size: .92em; }
pre { background: var(--surface); border: 1px solid var(--rule); padding: 1rem; border-radius: 4px; overflow-x: auto; }
table { border-collapse: collapse; width: 100%; }
th, td { padding: .5rem .75rem; border-bottom: 1px solid var(--rule); text-align: left; vertical-align: top; }
```

## Anti-patterns

Restart if the artifact has any three of these:

- Cards everywhere with rounded corners and shadows on gray
- Full-bleed gradient hero
- Emoji as section headers
- Four shades of indigo doing nothing
- Glass morphism, frosted blur, animated backgrounds
- Centered everything
- A header with a logo placeholder
