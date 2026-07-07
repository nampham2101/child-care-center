# Sunny Days Child Care Center

Marketing website and (future) staff admin portal for a child care center.
See [CLAUDE.md](CLAUDE.md) for the full project spec.

All content (center name, address, phone, staff, tuition figures) is **placeholder** —
swap in real content when available.

## What's here

- **Marketing site** (this pass): `site/index.html`, `site/about.html`,
  `site/programs.html`, `site/tuition.html`, `site/contact.html`, `site/styles.css`,
  `site/nav.js`. Plain HTML/CSS/JS, no build step — open any `.html` file directly in a
  browser, or serve the `site/` folder with any static file server (e.g. `npx serve site`,
  `python3 -m http.server --directory site`).
- `netlify.toml` — declares the publish directory (`site`) and the future Netlify
  Functions directory (`netlify/functions`). Inert until the admin portal is built.
- `package.json` — minimal scaffold; dependencies will be added once Netlify Functions code
  actually needs them.
- [`docs/admin-portal-plan.md`](docs/admin-portal-plan.md) — staged, checkable plan for
  building the admin portal described below.

## Not yet implemented

- `site/admin/` portal (login, dashboard, records pages) — the footer's "Staff Login"
  link points at `admin/login.html` (relative to the `site/` pages), which doesn't exist
  yet, so it currently 404s.
- Netlify Identity authentication.
- Netlify Functions (`add-entry`, `get-entries`) and Supabase-backed income/expense storage.
- Live wiring of the contact form to Netlify Forms (fields already use clean `name`
  attributes so this is a drop-in change later).
- Edit/delete for financial entries, reporting/export.

## Deployment (planned)

Target host is Netlify. The marketing pages deploy as static files with zero config;
the admin portal (once built) will use Netlify Functions + Identity, scoped to
`/site/admin` and `/netlify/functions` per CLAUDE.md. Supabase URL/keys will be Netlify
environment variables — never committed to this repo or sent to the browser.
