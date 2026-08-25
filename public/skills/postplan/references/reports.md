# Reports & Research

## Status Report

- Title with the week, team, author
- Shipped / in flight / blocked in three color-coded columns
- One line per item with a link to the PR/ticket
- "Asks" section separated from status — specific things the author needs

Brevity per item. A status report is read in 90 seconds or not at all.

## Incident Report

- Header: incident name, severity, duration, customer impact summary
- Minute-by-minute timeline as a vertical column — timestamps on one side, events on the other
- Log excerpts inline at relevant timestamps in `<pre>` blocks
- Root cause as a separate section
- "What worked" and "what didn't" side by side
- Action items with owners and deadlines

The timeline is a visual timeline, not a numbered list. Action items without owners don't happen. Leadership reads only the impact summary and action items.

## Concept Explainer

- Title, subtitle, one-paragraph TL;DR before any technical content
- Core insight as a single emphasized sentence
- Comparison table: this approach vs. the naive approach with concrete metrics
- "Where you'll meet it" — real systems that use this

The TL;DR gives away the answer. "Better" is meaningless; "moves 1/N keys instead of (N-1)/N" is meaningful.
