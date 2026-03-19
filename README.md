# Hub Frontend

A Nuxt 4 frontend for browsing and managing research content — articles, apps, and datasets — powered by a Strapi 5 CMS backend. Built with Nuxt UI v3.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A running Strapi 5 backend (default: `http://localhost:1338`)

## Installation

```bash

# Install dependencies
npm install
```

Create a `.env` file at the project root:

```
VITE_API_BASE_URL=http://localhost:1338
VITE_API_BEARER_TOKEN=<your-strapi-bearer-token>
```

- `VITE_API_BASE_URL` — URL of your Strapi backend
- `VITE_API_BEARER_TOKEN` — API token for authenticated operations (editing, publishing, media upload). Public browsing works without it.

## Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Building for Production

```bash
# Create an optimized build
npm run build

# Preview the production build locally
npm run preview
```

The build output is written to the `.output/` directory.

## Usage

### Browsing Content

Open `http://localhost:3000`. Use the tabs to switch between Articles, Apps, and Datasets. Filter by category, author, or year, or use the search box. Toggle between grid and list view with the view controls.

### Editing & Publishing

Each content type has its own preview and publish workflow:

| Content type | Live Preview route | Preview route |
|---|---|---|
| Articles | `/preview/[id]?status=draft` | `/previewreadonly/[id]?status=draft` |
| Apps | `/appspreview/[id]?status=draft` | `/appspreviewreadonly/[id]?status=draft` |
| Datasets | `/datasetpreview/[id]?status=draft` | `/datasetpreviewreadonly/[id]?status=draft` |

These routes are typically opened from within the Strapi admin panel. When opened standalone (not in an iframe), access requires a signed token passed as `?token=` in the query string.

## Project Structure

```
app/
├── app.vue                          # Root app component
├── assets/
│   └── style.css                    # Global styles
├── components/
│   └── RichTextEditor.vue           # WYSIWYG editor (Quill-based)
├── middleware/
│   └── preview-access.ts            # Token/iframe auth for preview routes
├── pages/
│   ├── index.vue                    # Home: tabbed Articles / Apps / Datasets listing
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
├── services/
│   └── api.js                       # Strapi API service layer
└── utils/
    └── previewToken.js              # Signed token utilities
nuxt.config.ts
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
