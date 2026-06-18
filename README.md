# Hub Frontend

A Nuxt 4 frontend for browsing and managing research content — articles, apps, datasets, and projects — powered by a Strapi 5 CMS backend. Built with Nuxt UI v3.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A running Strapi 5 backend (default: `http://localhost:1338`)

## Installation

```bash
pnpm install
```

Create a `.env` file at the project root:

```
VITE_API_BASE_URL=http://localhost:1338
API_BEARER_TOKEN=<your-strapi-bearer-token>
NUXT_API_TOKEN=<same value as API_BEARER_TOKEN>
NUXT_PREVIEW_SECRET=<your-preview-secret>
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Public URL of your Strapi backend. Used by the browser, the Nitro proxy, and the build-time scripts. |
| `API_BEARER_TOKEN` | Server-only Strapi API token. Injected by the Nitro proxy at runtime. Never exposed to the browser. Required for editing, publishing, and media upload. |
| `NUXT_API_TOKEN` | Same value as `API_BEARER_TOKEN`. Required by the deployed Netlify Function at runtime. |
| `NUXT_PREVIEW_SECRET` | Secret used to sign/verify the `?token=` query param on preview routes. |

## Running the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

> **Note:** Full-text search requires a Pagefind index. Run `pnpm build:full` (or at minimum `pnpm build && pnpm pagefind:build`) once to generate it. The search page will show a warning until the index exists.

## Building for Production

```bash
# Standard Nuxt build (also regenerates search-index.json automatically)
pnpm build

# Full build: Nuxt build + Pagefind index (required for search to work)
pnpm build:full

# Preview the production build locally
pnpm preview
```

The `pnpm build:full` command is the canonical production build. It:

1. Runs `nuxt build` (generates the static site and `search-index.json` / `file-parents.json`)
2. Runs `pnpm pagefind:build` — downloads PDF and Excel attachments from Strapi, converts PDFs to HTML stubs, and crawls all HTML with the Pagefind CLI to produce `/pagefind/pagefind.js`

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Nuxt production build (also writes `search-index.json` and `file-parents.json`) |
| `pnpm build:full` | Full production build including Pagefind index |
| `pnpm pagefind:build` | Run Pagefind indexer on an existing `.output/public/` (download attachments → generate PDF stubs → crawl HTML) |
| `pnpm preview` | Preview production build locally |
| `pnpm generate:search` | Regenerate `public/search-index.json` against the live Strapi API (local dev only) |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check with `vue-tsc` |
| `pnpm test` | Run Vitest unit tests |
| `pnpm a11y` | Run accessibility audit script |

## Deploying to Netlify

The project is pre-configured for Netlify static hosting with a serverless function proxy. The `netlify.toml` sets:

- **Build command:** `pnpm build && pnpm pagefind:build`
- **Publish directory:** `.output/public`
- **Node version:** 22
- **Preset:** `NITRO_PRESET=static`

### Required environment variables (set in Netlify UI)

| Variable | Used by |
|---|---|
| `VITE_API_BASE_URL` | Build (search index), browser (public API calls) |
| `API_BEARER_TOKEN` | Build (search index, attachment download) |
| `NUXT_API_TOKEN` | Netlify Function (API proxy at runtime) |
| `NUXT_PREVIEW_SECRET` | Netlify Function (preview token verification) |

### Netlify Function proxy

All mutating API calls are routed through a Netlify Function (`/.netlify/functions/strapi`) that injects the bearer token server-side. Preview routes are served from the SPA shell (`200.html`) so Vue Router's client-side middleware can handle auth without a full page reload.

**Do not set** `NUXT_STRAPI_URL`, `VITE_PREVIEW_SECRET`, or `VITE_API_BEARER_TOKEN` — these trigger Netlify's secrets scanner on the static bundle.

## Usage

### Browsing content

Open `http://localhost:3000`. Navigate between:

| Section | Route |
|---|---|
| Home / Articles | `/` |
| Articles listing | `/articles` |
| Article detail | `/articles/[slug]` |
| Apps listing | `/apps` |
| App detail | `/apps/[slug]` |
| Datasets / Data | `/data` |
| Dataset detail | `/datasets/[slug]` |
| Projects | `/projects` |
| Project detail | `/projects/[slug]` |
| Search | `/search` |
| PDF viewer | `/pdf-viewer?file=<url>&q=<query>` |

Each listing page includes a filter bar with topic, author, and year dropdowns, an inline search input, and a grid/list view toggle.

### Global search

`/search` provides a full-text cross-content search page powered by Pagefind. It searches across all published articles, apps, datasets, projects, **and the text content of attached PDF and Excel files**.

- Results are grouped by type (Articles, Apps, Datasets, Files)
- Each result card shows a Pagefind excerpt with matched terms highlighted in `<mark>` tags
- File results that belong to an article or dataset whose content also matched are nested under the parent card
- Orphan file matches (parent not in results) appear in a standalone Files section
- The URL stays in sync with the query (`?q=…`) so searches can be bookmarked or shared
- Clicking a PDF result opens the in-app PDF viewer with the search term pre-highlighted

### PDF viewer

`/pdf-viewer` renders PDFs in-browser using PDF.js. When opened from a search result with `?q=<query>`, it highlights every occurrence of the search term across all pages, with prev/next navigation controls and a match counter.

### Editing & publishing

Each content type has a two-stage editor/preview workflow:

| Content type | Edit route | Read-only preview route |
|---|---|---|
| Articles | `/preview/[id]?status=draft` | `/previewreadonly/[id]?status=draft` |
| Apps | `/appspreview/[id]?status=draft` | `/appspreviewreadonly/[id]?status=draft` |
| Datasets | `/datasetpreview/[id]?status=draft` | `/datasetpreviewreadonly/[id]?status=draft` |

These routes are typically opened from within the Strapi admin panel via a configured preview URL. Access is guarded by the `preview-access` middleware which validates a signed `?token=` query param when the page is opened outside an iframe.

Preview pages use a dedicated `preview` layout that:
- Hides the site navigation header
- Forces light mode regardless of the user's system preference

All save/publish/upload calls are routed through the Nitro proxy which injects the bearer token. The token never reaches the browser.

#### Article editor fields

The article editor (`/preview/[id]`) exposes:

- Title, date, categories, tags
- Authors (add/remove)
- Splash image (upload, change, remove via `useMedia`)
- Abstract (rich text)
- Article body (Markdown-based rich text with Quill, converted via Turndown on save)
- Funding, citation, DOI

Saves write a draft via `PUT /api/strapi/articles/[id]?status=draft`. The read-only preview (`/previewreadonly/[id]`) renders the draft and provides a Publish button.

### Search index

The search system uses two indices:

| File | Contents | Built by |
|---|---|---|
| `public/search-index.json` | Flat JSON list of all content items with metadata (title, categories, authors, date, image URL, attached file list) | Nitro `compiled` hook during `nuxt build` |
| `public/pagefind/` | Pagefind binary index crawled from the compiled HTML + PDF/Excel stubs | `pnpm pagefind:build` |
| `public/file-parents.json` | Map of file hash → parent article/dataset (used to link file search hits back to their parent) | Nitro `compiled` hook during `nuxt build` |

**Pagefind** is a static search engine. It crawls the compiled HTML (including HTML stubs generated from PDF text and Excel spreadsheets) and produces a compressed binary index loaded at runtime. Search is exact-phrase matched (terms are wrapped in double quotes before being passed to the Pagefind API).

**Local development** — after an initial full build, run:

```bash
pnpm generate:search   # regenerate search-index.json only (fast)
pnpm pagefind:build    # regenerate pagefind index (slower — downloads attachments)
```

**Production / CI** — `pnpm build:full` handles everything automatically. Set all four env vars (see above) in your CI environment.

## Project Structure

```
app/
├── app.vue                          # Root app component
├── assets/
│   └── style.css                    # Global styles
├── components/
│   ├── CategoryChips.vue            # Pill badges for categories/tags
│   ├── ContentCard.vue              # Shared card used in listing + search results
│   ├── ContentFilterBar.vue         # Filter dropdowns + inline search + view toggle
│   ├── HighlightText.vue            # Wraps text with <mark> highlights for a query
│   ├── ProjectsCarousel.vue         # Auto-scrolling project carousel on home page
│   ├── RichTextEditor.vue           # WYSIWYG editor (Quill-based, Markdown output)
│   ├── ScrollToTop.vue              # Floating scroll-to-top button
│   └── SidebarCard.vue              # Reusable sidebar info card
├── composables/
│   ├── useArticles.js               # Article fetch/update/publish via Strapi proxy
│   ├── useApps.js                   # App fetch/update/publish via Strapi proxy
│   ├── useDatasets.js               # Dataset fetch/update/publish via Strapi proxy
│   ├── useMedia.js                  # Media upload/listing via Strapi proxy
│   ├── usePagefind.ts               # Pagefind search composable (loads engine + enriches results)
│   ├── usePages.js                  # Fetch CMS page content (home page copy, stats, etc.)
│   ├── usePreviewEditor.js          # Shared state + helpers for edit-mode preview pages
│   ├── usePreviewReadonly.js        # Shared state + publish handler for read-only preview pages
│   ├── usePreviewUtils.js           # formatDate, fixAssetUrls, resolveImageUrl, formatFileSize
│   ├── useProjects.js               # Projects fetch via Strapi proxy
│   ├── useRelatedSearch.js          # Search helper for linking related content in editors
│   ├── useSearch.ts                 # Metadata index (search-index.json) loader + filter helpers
│   └── useSearchHighlight.ts       # DOM-level keyword highlighter for article detail pages
├── layouts/
│   ├── default.vue                  # Standard layout with site nav header
│   └── preview.vue                  # Preview layout: no nav, forces light mode
├── middleware/
│   └── preview-access.ts            # Token/iframe auth for all preview routes
├── pages/
│   ├── index.vue                    # Homepage (hero, stats, topics, projects carousel)
│   ├── search.vue                   # Global full-text search (Pagefind + file results)
│   ├── pdf-viewer.vue               # In-browser PDF viewer with search highlighting
│   ├── articles/
│   │   ├── index.vue                # Articles listing
│   │   └── [slug].vue               # Article detail view
│   ├── preview/
│   │   └── [id].vue                 # Article editor (draft, edit mode)
│   ├── previewreadonly/
│   │   └── [id].vue                 # Article read-only preview + publish
│   ├── apps/
│   │   ├── index.vue                # Apps listing
│   │   └── [slug].vue               # App detail view
│   ├── appspreview/
│   │   └── [id].vue                 # App editor (draft, edit mode)
│   ├── appspreviewreadonly/
│   │   └── [id].vue                 # App read-only preview + publish
│   ├── data/
│   │   └── index.vue                # Data/datasets listing
│   ├── datasets/
│   │   └── [slug].vue               # Dataset detail view
│   ├── datasetpreview/
│   │   └── [id].vue                 # Dataset editor (draft, edit mode)
│   ├── datasetpreviewreadonly/
│   │   └── [id].vue                 # Dataset read-only preview + publish
│   └── projects/
│       ├── index.vue                # Projects listing
│       └── [slug].vue               # Project detail view
└── utils/
    ├── apiConfig.js                 # API_BASE_URL + STRAPI_PROXY constants
    ├── formatters.js                # Shared date/text formatting helpers
    └── previewToken.js              # Signed token generation + validation
server/
└── api/
    └── strapi/
        └── [...path].ts             # Nitro catch-all proxy → Strapi (injects API_BEARER_TOKEN)
scripts/
├── generate-search-index.mjs        # CLI: regenerate public/search-index.json from Strapi API
├── pagefind-build.mjs               # CLI: download attachments → PDF stubs → pagefind crawl
└── lib/
    ├── build-search-index.mjs       # Core index builder (articles, apps, datasets)
    ├── download-pdf-attachments.mjs # Downloads PDFs from Strapi for pagefind indexing
    ├── download-excel-attachments.mjs # Downloads Excel/CSV files from Strapi for indexing
    ├── download-utils.mjs           # Shared fetch helpers with timeout + retry
    └── generate-pdf-stubs.mjs       # Converts downloaded PDFs to HTML stubs via pdf-parse
netlify.toml                         # Build command, publish dir, env vars, redirects
nuxt.config.ts                       # runtimeConfig, Nitro compiled hook, route rules, modules
```

## Troubleshooting

**Search page shows "Search index not available"**

Run `pnpm build:full` to generate both the metadata index and the Pagefind binary index. If you only need the metadata index for local development, `pnpm generate:search` is faster. The Pagefind index (under `public/pagefind/`) only updates when you run `pnpm pagefind:build` or `pnpm build:full`.

**`EACCES` permission error on Ubuntu**

If `npm install` fails with a permissions error, avoid `sudo`. Configure npm to use a local directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Port 3000 already in use**

Kill the process using the port, or change the dev server port in `nuxt.config.ts`:

```ts
devServer: { port: 3001 }
```

**Cannot connect to Strapi**

Ensure your Strapi backend is running and that `VITE_API_BASE_URL` in `.env` points to the correct address and port.

**Editing/publishing returns 401 or 403**

The bearer token must be set as `API_BEARER_TOKEN` (no `VITE_` prefix) — it is injected by the server-side proxy and must not be exposed to the browser. Restart the Nuxt server after adding it to `.env`. The old `VITE_API_BEARER_TOKEN` variable is no longer used.

**Preview pages show wrong data / blank fields**

Strapi 5 returns all content type fields in lowercase camelCase. The preview editor and save payload both use lowercase field names matching the Strapi API (`title`, `categories`, `authors`, `splash`, etc.).

**PDF attachment download times out during `pnpm pagefind:build`**

Increase the per-file timeout via an environment variable:

```bash
ATTACHMENT_TIMEOUT_MS=300000 pnpm pagefind:build
```
