# Reports & Research

## Status Report

- Title with the week, team, author
- Shipped, in flight, and blocked as three columns in a `<section class="wide columns">`
- The heading text carries the status. Color reinforces the status and never replaces it.
- One line per item with a link to the PR or ticket
- "Asks" section separated from status: specific things the author needs

Brevity per item. A status report is read in 90 seconds or not at all.

### Status Columns Sketch

```html
<section class="wide columns">
  <div>
    <h3 style="color: var(--ok)">Shipped</h3>
    <ul>
      <li><a href="<pr-or-ticket-url>">#<number></a> one-line summary</li>
      <li><a href="<pr-or-ticket-url>">#<number></a> one-line summary</li>
    </ul>
  </div>
  <div>
    <h3 style="color: var(--accent)">In flight</h3>
    <ul>
      <li><a href="<pr-or-ticket-url>">#<number></a> one-line summary</li>
    </ul>
  </div>
  <div>
    <h3 style="color: var(--danger)">Blocked</h3>
    <ul>
      <li><a href="<pr-or-ticket-url>">#<number></a> one-line summary, and what it is waiting on</li>
    </ul>
  </div>
</section>
<section>
  <h2>Asks</h2>
  <ul>
    <li>One specific ask, with a deadline</li>
  </ul>
</section>
```

## Incident Report

- Header: incident name, severity, duration, customer impact summary
- Minute-by-minute timeline as a `.timeline` list: timestamps on the left, events on the right
- Log excerpts inline at the relevant timestamp in `<pre>` blocks
- Root cause as a separate section
- "What worked" and "what did not" as two columns: `<section class="columns">` at prose width, no `.wide`
- Action items as a table with owner and deadline columns

The timeline is a list with a visual spine, not a numbered list. Action items without owners do not happen. Leadership reads only the impact summary and action items.

### Timeline Sketch

```html
<ol class="timeline">
  <li>
    <time datetime="<iso-timestamp>">14:02</time>
    <p>What happened, one sentence.</p>
  </li>
  <li>
    <time datetime="<iso-timestamp>">14:09</time>
    <p>What happened, one sentence.</p>
    <pre tabindex="0"><code>...log excerpt...</code></pre>
  </li>
  <li>
    <time datetime="<iso-timestamp>">14:31</time>
    <p>What happened, one sentence.</p>
  </li>
</ol>
```

## Concept Explainer

- Title, subtitle, one-paragraph TL;DR before any technical content
- Core insight as a single emphasized sentence
- Comparison table: this approach vs. the naive approach with concrete metrics. More than 4 columns: use the Wide Table pattern below.
- "Where you'll meet it": real systems that use this

The TL;DR gives away the answer. "Better" is meaningless; "moves 1/N keys instead of (N-1)/N" is meaningful.

## Wide Table

Any table with more than 4 columns. The table gets at least 44rem and scrolls sideways on phones. Tables with 4 columns or fewer need no wrapper.

```html
<div class="wide table-wrap" role="region" aria-label="<what the table shows>" tabindex="0">
  <table>
    <caption>What the table shows, and the period it covers</caption>
    <thead>
      <tr><th scope="col">Name</th><th scope="col" class="nowrap">Date</th><th scope="col" class="num">Metric</th><th scope="col" class="num">Metric</th><th scope="col" class="num">Metric</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">...</th><td class="nowrap">2026-01-01</td><td class="num">...</td><td class="num">...</td><td class="num">...</td></tr>
    </tbody>
  </table>
</div>
```
