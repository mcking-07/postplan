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

## Anti-Patterns

Restart if the artifact has any three of these:

- Every section in a pastel card with rounded corners
- Gradient backgrounds or decorative blurs
- Centered everything with no left-aligned prose
- Emoji as section markers
- Glass morphism, frosted blur, animated backgrounds
- A header with a logo placeholder
- A visual identity invented for this one artifact

## Viewer Experience

Apply these to every artifact:

- Always include `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- Define colors as semantic CSS custom properties on `:root`. Name them by role (`--bg`, `--text`, `--border`, `--surface`), not by appearance (`--dark-gray`, `--light-blue`).
- Default to dark mode. Override variables inside `@media (prefers-color-scheme: light)`. Never hardcode a single scheme.
- Every interactive element must have a minimum 44px hit area on touch devices. Use padding, not inflated font sizes.
- Every interactive element must have a visible `:focus-visible` outline. Replace the default ring if it clashes, but never remove it.
- Use semantic elements (`<nav>`, `<section>`, `<button>`) and ARIA attributes where they apply. Do not use divs and spans for interactive controls.
- Content that may exceed the viewport width (tables, code blocks, side-by-side comparisons, wide grids) must be individually scrollable. Wrap each instance in a `<div>` with `overflow-x: auto`. Apply the overflow to the wrapper, not to `<body>` or the page container. A `<pre>` can take `overflow-x: auto` directly without a wrapper.

## Document Rules

Every artifact runs under a strict Content Security Policy. The server hashes each inline script at serve time and pins it in `script-src`. Only the exact scripts uploaded will execute.

Enforced:

- `default-src 'none'`: nothing loads unless explicitly allowed.
- `script-src` pinned by SHA-256 hash. No `unsafe-inline`, no `unsafe-eval`.
- `style-src 'unsafe-inline' https:`: inline styles, `<style>` blocks, and `@import` stylesheets.
- `img-src https: data:`: images from HTTPS URLs and data URIs.
- `font-src https: data:`: web fonts from HTTPS URLs and data URIs.
- `frame-src https:`: iframes from HTTPS URLs.
- `media-src https:`: audio and video from HTTPS URLs.
- `connect-src 'none'`: no fetch, no XHR, no WebSocket, no sendBeacon.
- `base-uri 'none'`: no `<base>` tag.
- `form-action 'none'`: no form submissions.

Rejected (server returns 422):

- Empty documents
- Documents exceeding 2 MB (512 KB via the CLI)
- Nesting depth exceeding 512 levels
- Meta refresh redirects (`<meta http-equiv="refresh">`)

Maximum file size: 2 MB (512 KB via the CLI). Maximum nesting depth: 512 levels. Bundled apps work if everything is inlined into one HTML file.

## CLI Constraints

The CLI validates HTML before uploading. These rejections happen locally, before the request reaches the server.

- Blocked tags: `form`, `iframe`, `object`, `embed`, `applet`, `base`, `link`.
- Blocked attributes: inline event handlers (`on*`), `srcdoc`, `javascript:`/`vbscript:`/`file:` URLs, unsafe CSS expressions in `style`.
- Blocked scripts: `<script src>` (external sources), `<script type="module">`, `<script type="importmap">`. Only inline classic scripts pass (`text/javascript` or no type attribute).
- Size limit: 512 KB. The server accepts up to 2 MB, but the CLI rejects anything over 512 KB.
- Use `@import url(...)` inside a `<style>` block instead of `<link rel="stylesheet">`.
- Inline external script bodies into a `<script>` tag.
- Rewrite module scripts as classic, replacing `import`/`export` with IIFE patterns or concatenation.

## Direct Uploads

The CLI blocks tags and patterns the server accepts. When the artifact needs something the CLI rejects and no workaround exists, upload via curl instead.

- Iframes: the CLI blocks `<iframe>`, but the server stores it and the CSP allows `frame-src https:`.
- Large artifacts over 512 KB. The server accepts up to 2 MB.
- `<script type="module">` when rewriting to classic is impractical.

```sh
curl -X POST https://postplan.mcking.in/api/uploads \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"html": "...", "filename": "<name>.html", "description": "<description-or-summary>"}'
```

To update an existing draft, add `"draftId": "<id>"` to the JSON body. Response fields: `draftId`, `publicUrl`, `rawUrl`, `versionNumber`, `warnings`.

Curl bypasses CLI validation, not the CSP. The server still enforces `connect-src 'none'`, `form-action 'none'`, and hash-pinned `script-src`.

## Upload

Write the file inside the project directory. Use `plans/` if it exists, otherwise a gitignored scratchpad directory if one exists, otherwise create `.postplan/`. The CLI captures git metadata from the file's parent directory. Files outside a git repo lose git context.

```sh
postplan upload <file>
```

Same local file path updates the existing draft. Use `--new` to create a separate draft. Use `--description` to set a summary. If the CLI has not been configured yet, add `--api-url https://postplan.mcking.in`.

The CLI prints a draft URL and a raw URL. Hand the raw URL to another agent when you want the most explicit form.

## Viewer Behavior

Every PostPlan URL serves the uploaded artifact to every client. There is no wrapper page, sandbox UI, or consent step. The `/raw` suffix is an alias that returns the same document.

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
