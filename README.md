# Sunny Days Child Care Center

Marketing website and (future) staff admin portal for a child care center.
See [CLAUDE.md](CLAUDE.md) for the full project spec.

All content (center name, address, phone, staff, tuition figures) is **placeholder** —
swap in real content when available.

## What's here

- **Marketing site** (this pass): `index.html`, `about.html`, `programs.html`,
  `tuition.html`, `contact.html`, `styles.css`, `nav.js`. Plain HTML/CSS/JS, no build step —
  open any `.html` file directly in a browser, or serve the folder with any static file
  server (e.g. `npx serve`, `python3 -m http.server`).
- `netlify.toml` — declares the future Netlify Functions directory (`netlify/functions`)
  and publish directory (`.`). Inert until the admin portal is built.
- `package.json` — minimal scaffold; dependencies will be added once Netlify Functions code
  actually needs them.

## Not yet implemented

- `admin/` portal (login, dashboard, records pages) — the footer's "Staff Login" link
  points at `admin/login.html`, which doesn't exist yet, so it currently 404s.
- Netlify Identity authentication.
- Netlify Functions (`add-entry`, `get-entries`) and Supabase-backed income/expense storage.
- Live wiring of the contact form to Netlify Forms (fields already use clean `name`
  attributes so this is a drop-in change later).
- Edit/delete for financial entries, reporting/export.

## Deployment (planned)

Target host is Netlify. The marketing pages deploy as static files with zero config;
the admin portal (once built) will use Netlify Functions + Identity, scoped to `/admin`
and `/netlify/functions` per CLAUDE.md. Supabase URL/keys will be Netlify environment
variables — never committed to this repo or sent to the browser.
