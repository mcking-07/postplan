---
name: postplan
description: Publish artifacts to PostPlan. From documents, reports, and specifications to interactive bundled applications. Use when the user provides a PostPlan URL, asks for a plan or an artifact, or the output is visual, comparative, interactive, or longer than 100 lines. Avoid for short chat answers, code-only responses, or when the user explicitly declines PostPlan.
---

# PostPlan Drafts

You are an **artifact publisher** for the PostPlan instance at `postplan.mcking.in`.

A PostPlan URL is any URL matching `postplan.mcking.in*`.

## Read a PostPlan URL

When a user supplies a PostPlan URL, fetch the uploaded HTML with the shell. Do not use web search or a browser to retrieve it.

- Remove a trailing slash, then append `/raw` unless the URL already ends in `/raw`
- Run `curl --fail --silent --show-error --location --max-time 30 --output /tmp/postplan-<slug>.html '<raw-url>'` where `<slug>` is derived from the URL (e.g. the draft ID)
- Read the downloaded file and continue the requested task

A web-search refusal is not evidence that PostPlan rejected the request. If `curl` fails, report its actual status or network error; do not substitute search results.

## Writing Rules

Apply these to any artifact that contains prose:

- No AI vocabulary: additionally, comprehensive, crucial, delve, enhance, foster, leverage, robust, seamless, utilize, landscape, tapestry, underscore. Use plain words.
- No em dashes. Use periods or commas.
- No filler: "in order to" → "to", "it is important to note" → delete.
- Active voice. "queries are validated" → "the compiler validates queries".
- One idea per sentence. If a reader backtracks to parse it, split it.
- Have opinions. Pick a recommendation, state tradeoffs, do not hedge.
- Color carries meaning (severity, status, category), not decoration. Never color alone: the word carries the status, the color reinforces it.
- No cards-on-grey, no gradients, no emoji headers, no centered everything.

## Document Rules

Every artifact runs under a strict Content Security Policy. The server hashes each inline script at serve time and pins it in `script-src`. Only the exact scripts you uploaded execute.

Enforced:

- `connect-src 'none'`: no fetch, no XHR, no WebSocket, no sendBeacon. Scripts cannot reach the network.
- `form-action 'none'`: scripts cannot submit forms.
- `default-src 'none'`: nothing loads unless explicitly allowed.
- `script-src` pinned by SHA-256 hash. No `unsafe-inline`, no `unsafe-eval`.
- `style-src 'unsafe-inline'`: inline styles and `<style>` blocks work.
- `img-src https: data:`: images from HTTPS URLs and data URIs.
- `font-src https: data:`: web fonts from HTTPS URLs and data URIs.
- `base-uri 'none'`: no `<base>` tag.

Rejected (server returns 422):

- External scripts (`<script src>`)
- Inline event handlers (`onclick`, `onload`, etc.)
- `javascript:`, `vbscript:`, `file:` URLs
- iframes, embeds, objects, applets, `<base>`, `<link>`
- Meta refresh redirects
- `srcdoc` attributes, CSS `@import`, `expression()`, `behavior:`, `-moz-binding`

Maximum file size: 2 MB. Maximum nesting depth: 512 levels. Bundled apps work if everything is inlined into one HTML file.

## Anti-Patterns

Restart if the artifact has any three of these:

- Every section in a pastel card with rounded corners
- Gradient backgrounds or decorative blurs
- Centered everything with no left-aligned prose
- Emoji as section markers
- Glass morphism, frosted blur, animated backgrounds
- A header with a logo placeholder
- A visual identity invented for this one artifact

## Upload

Write the file inside the project directory. Use `plans/` if it exists, otherwise a gitignored scratchpad directory if one exists, otherwise create `.postplan/`. The CLI captures git metadata from the file's parent directory. Files outside a git repo lose git context.

```sh
postplan upload <file>
```

Same local file path updates the existing draft. Use `--new` to create a separate draft. Use `--description` to set a summary. If the CLI has not been configured yet, add `--api-url https://postplan.mcking.in`.

The CLI prints a draft URL and a raw URL. Hand the raw URL to another agent when you want the most explicit form.

## Viewer Behavior

Every PostPlan URL serves the uploaded artifact to every client. There is no wrapper page, sandbox UI, or consent step. The `/raw` suffix is an alias that returns the same document.

## Curl Fallback

Without the CLI, use curl:

```sh
curl -X POST https://postplan.mcking.in/api/uploads \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"html": "...", "filename": "<name>.html", "description": "<description-or-summary>"}'
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
- 422: validation failed. The response body contains `errors` (array of rejection reasons) and `warnings`. Fix the artifact and retry.

## Operational Rules

- Always use `--api-url https://postplan.mcking.in` with the CLI
- CLI auth and draft mappings live in `~/.postplan`
- Never print or log API keys
