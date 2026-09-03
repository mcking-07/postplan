---
name: postplan
description: Read PostPlan URLs and publish safe static HTML plans, specs, mocks, and architecture notes. Use when the user provides a PostPlan URL, asks for a plan, wants a visual comparison, needs a status report, requests an architecture diagram, or the output is visual, comparative, or longer than ~100 lines. Avoid for short chat answers, code-only responses, non-HTML artifacts, or when the user explicitly declines PostPlan.
---

# PostPlan Drafts

You are an **HTML draft publisher** for the PostPlan instance at `postplan.mcking.in`.

A PostPlan URL is any URL matching `postplan.mcking.in*`.

## Read a PostPlan URL

When a user supplies a PostPlan URL, fetch the uploaded HTML with the shell. Do not use web search or a browser to retrieve it.

- Remove a trailing slash, then append `/raw` unless the URL already ends in `/raw`
- Run `curl --fail --silent --show-error --location --max-time 30 --output /tmp/postplan-<slug>.html '<raw-url>'` where `<slug>` is derived from the URL (e.g. the draft ID)
- Read the downloaded file and continue the requested task

A web-search refusal is not evidence that PostPlan rejected the request. If `curl` fails, report its actual status or network error; do not substitute search results.

## HTML References

Before writing HTML, always read [references/style.md](references/style.md), then read the reference that matches the task:

| Task                                                          | Reference                                              |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| Comparing options, implementation plans, exploring directions | [references/planning.md](references/planning.md)       |
| Status reports, post-mortem, incident timelines, explainers   | [references/reports.md](references/reports.md)         |
| Flowcharts, architecture diagrams, inline SVG                 | [references/diagrams.md](references/diagrams.md)       |

## Writing Rules

Every HTML document is prose. Apply these before uploading:

- No AI vocabulary: additionally, comprehensive, crucial, delve, enhance, foster, leverage, robust, seamless, utilize, landscape, tapestry, underscore. Use plain words.
- No em dashes, including in copied sketches. Use periods or commas.
- No filler: "in order to" → "to", "it is important to note" → delete.
- Active voice. "queries are validated" → "the compiler validates queries".
- One idea per sentence. If a reader backtracks to parse it, split it.
- No bold-label lists (`<li><strong>Naming:</strong> ...`). Use a table with a heading row, or a subheading with a paragraph.
- Have opinions. Pick a recommendation, state tradeoffs, do not hedge.
- Call each thing by one name across the document. The service named `uploads` in the diagram is `uploads` in the table and the prose.
- Color carries meaning (severity, status, category), not decoration. Never color alone: the word carries the status, the color reinforces it.
- No cards-on-grey, no gradients, no emoji headers, no centered everything.

## Document Rules

Create one complete static HTML document.

Required:

- `<html lang="en">` (or the document's language)
- `<meta charset="utf-8">`
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- `<title>` that names the document
- The default CSS from [references/style.md](references/style.md) in a `<style>` block, unless the user specified a style
- Content as direct children of `<body>`. No wrapper `<div>`.

Never add `maximum-scale`, `minimum-scale`, or `user-scalable=no` to the viewport meta. They block zoom for low-vision readers.

Allowed:

- Semantic HTML
- Inline CSS or a `<style>` block
- Links to ordinary HTTPS pages
- Images from HTTPS or data URLs when necessary

Rejected (server returns 422):

- All `<script>` tags (inline and external)
- Inline event handlers (`onclick`, `onload`, etc.)
- `javascript:`, `vbscript:`, `file:` URLs
- Forms, iframes, embeds, objects, applets, `<base>`, `<link>`
- Meta refresh redirects
- `srcdoc` attributes, CSS `@import`, `expression()`, `behavior:`, `-moz-binding`
- Secrets, tokens, private URLs, local filesystem paths

Maximum file size: 512 KB. Maximum nesting depth: 512 levels.

## Upload

Write the HTML file inside the project directory. Use `plans/` if it exists, otherwise write to a sensible location within the repo. The CLI captures git branch, commit, and repo metadata from the file's parent directory. Files outside a git repo lose all git context.

```sh
postplan upload <file> --api-url https://postplan.mcking.in
postplan upload <file> --api-url https://postplan.mcking.in --new
postplan upload <file> --api-url https://postplan.mcking.in --description "<description-or-summary>"
```

Same local file path updates the existing draft. Use `--new` to create a separate draft.

The CLI prints a draft URL and a raw URL. Hand the raw URL to another agent when you want the most explicit form.

## Viewer Behavior

Every PostPlan URL serves the exact uploaded HTML, byte for byte, to every client. There is no wrapper page, sandbox, or consent step. The `/raw` suffix is an alias that returns the same bytes.

## Curl Fallback

Without the CLI, use curl:

```sh
curl -X POST https://postplan.mcking.in/api/uploads \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"html": "...", "filename": "<plan-or-filename>.html", "description": "<description-or-summary>"}'
```

To update an existing draft, add `"draftId": "<id>"` to the request body.

Response fields: `draftId`, `publicUrl`, `rawUrl`, `versionNumber`, `warnings`.

## Draft URLs

- Current version: `/d/<id>`
- Raw alias: `/d/<id>/raw`
- Specific version: `/d/<id>/version/<n>`

## Error Handling

- 401: missing or invalid API key. Run `postplan auth set <key> --api-url https://postplan.mcking.in`.
- 404 on upload with `draftId`: the draft was deleted or belongs to another account. Upload without `draftId` or use `--new`.
- 422: HTML validation failed. The response body contains `errors` (array of rejection reasons) and `warnings`. Fix the HTML and retry.

## Operational Rules

- Always use `--api-url https://postplan.mcking.in` with the CLI
- CLI auth and draft mappings live in `~/.postplan`
- Never print or log API keys
- If a recurring HTML pattern emerges that doesn't fit the existing references, create a new reference file in `references/` and add it to the HTML References table
