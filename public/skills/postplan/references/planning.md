# Exploration & Planning

## Side-by-Side Comparison

- One column per option, or a responsive grid for 4+
- Identical internal structure across columns — same headings, same sub-sections
- Each column: framing sentence, code/diagram, pro/con table, hard metrics row
- Recommendation block at the bottom — pick one, explain why

Pro/con as a two-column table, not bullets. Metrics row forces the recommendation to be defensible. If approach 1 has a metric and approach 2 doesn't, the reader assumes the worst.

Mistakes: all code in one block above the comparison; refusing to recommend; three approaches that are really one with minor variations.

## Implementation Plan

- Title and one-paragraph problem statement
- Milestones as a visual timeline strip, not a numbered list
- Data-flow diagram (inline SVG) showing what talks to what
- The 2–3 load-bearing code snippets with annotations
- Risk table: risk / likelihood / mitigation
- "What we're explicitly not doing" section

The diagram is not optional. The risk table is not optional. The "not doing" section prevents scope creep.

Mistakes: markdown plan with HTML wrapping; listing every file instead of the shape of the change.

## Sketch

```html
<section style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
  <article>
    <h2>01. Approach Name</h2>
    <p>One-line summary.</p>
    <pre><code>...code...</code></pre>
    <table>
      <tr><th>Pro</th><th>Con</th></tr>
      <tr><td>Zero abstraction</td><td>Logic duplicated</td></tr>
    </table>
  </article>
  <article><!-- 02 --></article>
  <article><!-- 03 --></article>
</section>
<footer>
  <h2>Recommendation</h2>
  <p>Go with 02 — here's why.</p>
</footer>
```
