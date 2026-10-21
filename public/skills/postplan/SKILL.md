---
name: postplan
description: Publish artifacts to PostPlan. From documents, reports, and specifications to interactive bundled applications, as one page or a folder of linked pages. Use when the user provides a PostPlan URL, asks for a plan or an artifact, or the output is visual, comparative, interactive, or longer than 100 lines. Avoid for short chat answers, code-only responses, HTML that ships in the product, or when the user explicitly declines PostPlan.
---

# PostPlan Artifact Publisher

You are an **artifact publisher** for the PostPlan instance at `postplan.mcking.in`.

A PostPlan URL is any URL matching `postplan.mcking.in*`.

## Read a PostPlan URL

When a user supplies a PostPlan URL, fetch the uploaded HTML with the shell. Do not use web search or a browser to retrieve it.

- Drop any `#fragment` and keep the rest of the URL as given. A page path (`/d/<id>/<page>`) or a version (`/d/<id>/version/<n>`) names exactly what to read.
- Create a fresh file for each fetch with `mktemp -t postplan.XXXXXX`. It prints a path; call it `<path>`.
- Run `curl --fail --silent --show-error --location --max-time 30 --dump-header <path>.headers --output <path> --write-out '%{url_effective}\n' '<url>'`. It prints the final URL after redirects.
- Read the downloaded file and continue the requested task. `x-postplan-draft-version` in the headers file is the version you read; cite it when the user may update the draft later.
- For a folder draft, resolve relative links against the final URL curl prints (a `<base href>` overrides it), and fetch each page the task needs the same way.

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

Every artifact runs in a sandbox with an opaque origin, under a strict Content Security Policy. Inline scripts and `on*` handlers run, but cannot reach PostPlan or browser storage.

Enforced:

- `default-src 'none'`: nothing loads unless explicitly allowed.
- `script-src 'unsafe-inline'`: inline classic and `type="module"` scripts and `on*` handlers. Data blocks such as `<script type="application/json">` never run.
- `style-src 'unsafe-inline' https:`: inline styles, `<style>` blocks, and `@import` stylesheets.
- `img-src https: data:`: images from HTTPS URLs and data URIs.
- `font-src https: data:`: web fonts from HTTPS URLs and data URIs.
- `media-src https: data:`: audio and video from HTTPS URLs and data URIs.
- `connect-src 'none'`: no fetch, no XHR, no WebSocket, no sendBeacon.
- `worker-src 'none'`, `frame-src 'none'`, `object-src 'none'`: no workers, frames, or plugins.
- `base-uri https:`: a `<base>` tag must use an HTTPS URL.
- `form-action 'none'`: no form submissions.
- `sandbox`: localStorage, sessionStorage, indexedDB, and cookies throw; `alert`, `confirm`, and `prompt` do nothing. Popups, `target="_blank"` links, and downloads work. Keep state in memory or in `location.hash`.

Rejected (server returns 422):

- Empty documents
- Uploads over 4 MiB of HTML, all pages combined
- Nesting depth exceeding 512 levels
- Meta refresh redirects (`<meta http-equiv="refresh">`)
- External scripts (`<script src>`) and unknown script types
- `<form>`, `<iframe>`, `<object>`, `<embed>`, `<applet>`
- `javascript:`, `vbscript:`, and `file:` URLs
- `<link>` other than HTTPS stylesheets, icons, preconnects, DNS prefetches, and alternates

Bundled apps work if everything is inlined into one HTML file. Local files do not load: PostPlan hosts only HTML, so use an HTTPS or data: URL.

## Upload

Write the file inside the project directory. Use `plans/` if it exists, otherwise a gitignored scratchpad directory if one exists, otherwise create `.postplan/`. The CLI captures git metadata from the file's parent directory. Files outside a git repo lose git context.

1. Run `postplan check <file>`. Fix every error at the line it names, and treat each warning as something that will break for the reader. Done when it prints `Ready.`
2. Run `postplan upload <file> --json`.
3. Report the receipt's `url` and `versionUrl`. The artifact is published only when the receipt has `"ok": true`.

The same local file path updates the existing draft, and identical content returns the current version instead of a new one. To update later, run the receipt's `updateCommand`. Use `--new` to create a separate draft. Use `--description` to set a summary of up to 1000 characters; `check` does not see it. Use `--slug <name>` with both `check` and `upload` for a custom URL.

## Folders

Upload a folder to publish linked pages: `postplan upload <folder> --json`.

- The folder needs an `index.html`. Only `.html` files are uploaded; hidden files and `node_modules` are skipped.
- Link pages with relative paths (`href="<page>.html"`, `href="<dir>/"`). Inline each page's CSS and JavaScript.
- Up to 50 pages. A page path cannot start with `v`, `raw`, `version`, `versions`, `api`, or `healthz`.
- Pages serve at `/d/<id>/<page>`, `/d/<id>/<page>.html`, and `/d/<id>/<dir>/`.

## Custom URLs

Use a custom URL when the user asks for one, or when `postplan check` prints `Custom URLs: enabled` and you judge the artifact worth sharing. `postplan upload <file> --slug <name> --json` publishes at `/d/<name>`. The same slug updates the same draft from any machine or path.

- `--draft <draft-id> --slug <name>` moves an existing draft to a custom URL and frees its old one.
- `postplan check --slug <name>` reports `available`, `yours`, `taken`, or `unavailable`. `yours` means one of your drafts already has the name, and uploading replaces its content. Use it only to update that same artifact; otherwise pick another name.
- Use 3-40 characters of `a-z`, `0-9`, and inner hyphens that describe the artifact, not a date or version. Some names are reserved; `check` reports them.
- The CLI help says `<name>.postplan.dev`; on this server the URL is `/d/<name>`. The receipt's `url` is always right.

## Direct API

Use the API when Node is not available, or to delete a draft; the CLI has no delete command. Every request needs `Authorization: Bearer <api-key>`.

```sh
curl -X POST https://postplan.mcking.in/api/uploads \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"html": "<html>", "filename": "<file>", "description": "<description>"}'
```

- For a folder, send `"files": [{"path": "<page>.html", "html": "<html>"}]` instead of `"html"`.
- To update a draft, add `"draftId": "<draft-id>"`. For a custom URL, add `"slug": "<name>"`.
- `POST /api/check` takes the same body and returns the report without publishing.
- `DELETE /api/drafts/<draft-id>` deletes a draft and frees its custom URL.

## Viewer Behavior

Every PostPlan URL serves the uploaded artifact to every client. There is no wrapper page, sandbox UI, or consent step. Responses carry `x-postplan-draft-id` and `x-postplan-draft-version`.

## Draft URLs

`<id>` is the draft ID or the custom URL.

- Current version: `/d/<id>`
- Raw alias: `/d/<id>/raw`
- Specific version: `/d/<id>/version/<n>`
- A page of a folder: `/d/<id>/<page>`, or `/d/<id>/version/<n>/<page>`

## Error Handling

The CLI prints `Upload rejected (HTTP <status>): <error>`, followed by one line per problem; with `--json` it prints `status`, `error`, `errors`, and `issues`. Each message names the problem and, where there is one, the fix. The server reports every problem in one response, so fix them all before you retry; the status code alone does not say what failed.

These need an action the message does not give:

- 401: get a key from `https://postplan.mcking.in/cli/auth` and run `postplan auth set <key> --api-url https://postplan.mcking.in`.
- 403: the account lacks a feature flag. Tell the user about it; only an admin grants flags. `postplan check` lists the account's flags.
- 404 for a draft: it was deleted or belongs to another account. Upload with `--new`.
- 503: storage failed. Retry the upload.

## Updates

The CLI and this skill update together from `https://postplan.mcking.in/llms.txt`. A CLI that rejects a command used here is out of date.

## Operational Rules

- Always use `--api-url https://postplan.mcking.in` with the CLI
- CLI auth and draft mappings live in `~/.postplan`
