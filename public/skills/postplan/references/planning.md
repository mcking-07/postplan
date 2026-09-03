# Exploration & Planning

## Side-by-Side Comparison

- One column per option. Use `<section class="wide columns">` so the columns have room; they stack on phones by themselves.
- Name each option by what it is, not by a number. Numbers imply an order or a ranking that options do not have. Number only real sequences: milestones, incident steps.
- Identical internal structure across columns: same headings, same sub-sections, same order.
- Each column: framing sentence, code or diagram, pros and cons table, hard metrics row.
- Recommendation section at the bottom. Pick one, explain why.

Pros and cons as a two-column table, not bullets. The metrics row forces the recommendation to be defensible. If approach 1 has a metric and approach 2 does not, the reader assumes the worst.

Mistakes: all code in one block above the comparison; refusing to recommend; three approaches that differ only in details; a fourth column when two options are enough.

## Implementation Plan

- Title and one-paragraph problem statement
- Milestones as a `.timeline` list (see reports.md for the markup), not a numbered list
- Data-flow diagram as inline SVG in a `<figure>` (see diagrams.md)
- The 2 to 3 load-bearing code snippets with annotations. Add `class="wide"` only when lines exceed the prose width.
- Risk table with columns for risk, likelihood, mitigation, and owner. More than 4 columns: wrap in `<div class="wide table-wrap">` (see reports.md)
- "What we're explicitly not doing" section

The diagram is not optional. The risk table is not optional. The "not doing" section prevents scope creep.

Mistakes: markdown plan with HTML wrapping; listing every file instead of the shape of the change.

## Sketch

```html
<section class="wide columns">
  <article>
    <h2>Option name</h2>
    <p>One-line summary.</p>
    <pre tabindex="0"><code>...code...</code></pre>
    <table>
      <thead><tr><th scope="col">Pro</th><th scope="col">Con</th></tr></thead>
      <tbody><tr><td>...</td><td>...</td></tr></tbody>
    </table>
    <p><strong>Metric:</strong> value. <strong>Metric:</strong> value.</p>
  </article>
  <article><!-- second option, same structure --></article>
  <article><!-- third option, same structure --></article>
</section>
<section>
  <h2>Recommendation</h2>
  <p>Go with <chosen-option>. One or two sentences on why.</p>
</section>
```

`.columns` gives three columns above about 900px, two on tablets, one on phones. Four options make four narrow columns on desktop; if each option needs code or a table, cut to three or split into two `.columns` sections.
