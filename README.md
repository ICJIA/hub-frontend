# Hub Frontend

A Nuxt 4 frontend for browsing and managing research content — articles, apps, and datasets — powered by a Strapi 5 CMS backend. Built with Nuxt UI v3.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A running Strapi 5 backend (default: `http://localhost:1338`)

## Installation

```bash
# Install dependencies
pnpm install
```

Create a `.env` file at the project root:

```
VITE_API_BASE_URL=http://localhost:1338
API_BEARER_TOKEN=<your-strapi-bearer-token>
```

- `VITE_API_BASE_URL` — URL of your Strapi backend (also used by the server-side proxy and search index build)
- `API_BEARER_TOKEN` — Server-only API token injected by the Nitro proxy. Never exposed to the browser. Required for editing, publishing, and media upload.

## Running the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

> **Note:** The search feature requires a search index. Generate it once before starting the dev server (see [Search index](#search-index) below).

## Building for Production

```bash
# Create an optimized build (also regenerates the search index automatically)
pnpm build

# Preview the production build locally
pnpm preview
```

The build output is written to the `.output/` directory.

## Available scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build (auto-regenerates search index) |
| `pnpm preview` | Preview production build |
| `pnpm generate:search` | Generate `public/search-index.json` for local dev |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check with `vue-tsc` |
| `pnpm test` | Run Vitest unit tests |
| `pnpm a11y` | Run accessibility audit script |

## Usage

### Browsing content

Open `http://localhost:3000`. Navigate between Articles (`/`), Apps (`/apps`), and Datasets (`/datasets`). Each listing page includes a filter bar with topic, author, and year dropdowns, an inline search input, and a grid/list view toggle.

### Global search

`/search` provides a cross-content-type fuzzy search page. Enter any term to find matching articles, apps, and datasets in a single view. Results are grouped by type and the URL stays in sync with the query (`?q=…`) so searches can be bookmarked or shared.

### Editing & Publishing

Each content type has its own preview and publish workflow:

| Content type | Live Preview route | Preview route |
|---|---|---|
| Articles | `/preview/[id]?status=draft` | `/previewreadonly/[id]?status=draft` |
| Apps | `/appspreview/[id]?status=draft` | `/appspreviewreadonly/[id]?status=draft` |
| Datasets | `/datasetpreview/[id]?status=draft` | `/datasetpreviewreadonly/[id]?status=draft` |

These routes are typically opened from within the Strapi admin panel. When opened standalone (not in an iframe), access requires a signed token passed as `?token=` in the query string.

All mutating API calls (save, publish, media upload) are routed through a server-side Nitro proxy (`/api/strapi/[...path]`) that injects the `API_BEARER_TOKEN`. The bearer token is never sent to the browser.

### Search index

Search is powered by [Fuse.js](https://fusejs.io/) and a pre-built JSON index (`public/search-index.json`) fetched at runtime. The index contains all published articles, apps, and datasets from the Strapi API with Markdown stripped from article body text.

**Local development** — generate the index once (requires `VITE_API_BASE_URL` to be set):

```bash
pnpm generate:search
```

**Production / CI** — the index is rebuilt automatically by a Nitro `compiled` hook in `nuxt.config.ts` during `pnpm build`. The hook reads `API_BEARER_TOKEN` (not `VITE_API_BEARER_TOKEN`) so set that variable in your CI environment. No manual step is needed.

The `useSearch()` composable ([app/composables/useSearch.ts](app/composables/useSearch.ts)) exposes the full search API:

```ts
const { loadIndex, search, searchByType, getByType, isLoaded, isLoading, loadError } = useSearch()

await loadIndex()                        // lazy-loads the index once per session
search('community violence')             // global fuzzy search → SearchItem[]
searchByType('sentencing', 'article')    // type-scoped fuzzy search
getByType('dataset')                     // all items of a type, unfiltered
```

## Project Structure

```
app/
├── app.vue                          # Root app component
├── assets/
│   └── style.css                    # Global styles
├── components/
│   ├── ContentCard.vue              # Shared card used in listing + search results
│   ├── ContentFilterBar.vue         # Filter dropdowns + inline search + view toggle
│   └── RichTextEditor.vue           # WYSIWYG editor (Quill-based)
├── composables/
│   ├── useSearch.ts                 # Fuse.js search composable (session-scoped state)
│   ├── useArticles.js               # Article CRUD via Strapi proxy
│   ├── useApps.js                   # App CRUD via Strapi proxy
│   ├── useDatasets.js               # Dataset CRUD via Strapi proxy
│   └── useMedia.js                  # Media upload/listing via Strapi proxy
├── middleware/
│   └── preview-access.ts            # Token/iframe auth for preview routes
├── pages/
│   ├── index.vue                    # Homepage (articles, stats, topics, projects)
│   ├── search.vue                   # Global cross-type search page
│   ├── article/
│   │   └── [id].vue                 # Article detail view
│   ├── preview/
│   │   └── [id].vue                 # Article editor (draft preview)
│   ├── previewreadonly/
│   │   └── [id].vue                 # Article publish view
│   ├── apps/
│   │   ├── index.vue                # Apps listing
│   │   └── [id].vue                 # App detail view
│   ├── appspreview/
│   │   └── [id].vue                 # App editor (draft preview)
│   ├── appspreviewreadonly/
│   │   └── [id].vue                 # App publish view
│   ├── datasets/
│   │   ├── index.vue                # Datasets listing
│   │   └── [id].vue                 # Dataset detail view
│   ├── datasetpreview/
│   │   └── [id].vue                 # Dataset editor (draft preview)
│   └── datasetpreviewreadonly/
│       └── [id].vue                 # Dataset publish view
└── utils/
    ├── apiConfig.js                 # API base URL + STRAPI_PROXY constant
    └── previewToken.js              # Signed token utilities
server/
└── api/
    └── strapi/
        └── [...path].ts             # Nitro catch-all proxy → Strapi (injects API_BEARER_TOKEN)
scripts/
└── generate-search-index.mjs        # CLI script to build public/search-index.json
nuxt.config.ts                       # runtimeConfig + Nitro compiled hook (auto-builds search index)
```

## Troubleshooting

**`EACCES` permission error on Ubuntu**

If `npm install` fails with a permissions error, avoid using `sudo`. Instead, configure npm to use a local directory:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Port 3000 already in use**

Kill the process using the port, or change the dev server port in `nuxt.config.ts`:

```ts
devServer: {
  port: 3001
}
```

**Cannot connect to Strapi**

Make sure your Strapi backend is running and that `VITE_API_BASE_URL` in `.env` points to the correct address.

**Editing/publishing returns 401 or 403**

The bearer token is now injected by the server-side proxy and must be set as `API_BEARER_TOKEN` (no `VITE_` prefix). Ensure this variable is present in `.env` and that the Nuxt server has been restarted after adding it. The old `VITE_API_BEARER_TOKEN` variable is no longer read.
