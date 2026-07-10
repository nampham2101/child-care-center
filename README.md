# Sunny Days Child Care Center

Marketing website + a login-protected staff admin portal for tracking income and
expenses. See [CLAUDE.md](CLAUDE.md) for the full project spec and
[docs/admin-portal-plan.md](docs/admin-portal-plan.md) for the staged build plan.

All center content (name, address, phone, staff, tuition figures) is **placeholder** —
swap in real content when available.

## What's here

- **Marketing site** — `site/index.html`, `site/about.html`, `site/programs.html`,
  `site/tuition.html`, `site/contact.html`, plus shared `site/styles.css` and
  `site/nav.js`. Plain HTML/CSS/vanilla JS, no build step.
- **Admin portal** — `site/admin/` (`login.html`, `index.html` dashboard,
  `records.html`). Uses Netlify Identity for auth; the dashboard adds entries and shows
  running totals; records lists/filters entries. Shared client in `site/admin/admin-api.js`.
- **Netlify Functions** — `netlify/functions/add-entry.mjs` and `get-entries.mjs`
  (auth-checked), talking to Supabase via the service-role key (server-side only).
- `netlify.toml` (publish dir `site`, functions dir `netlify/functions`), `package.json`,
  and `docs/`.

## Running locally

### Full app (marketing site + admin portal + functions)

The admin portal needs the Netlify Functions running, so use the Netlify CLI — it serves
the site, runs the functions, and injects the Supabase env vars from the linked Netlify
project (no local secrets needed).

One-time setup:

```bash
npm install                 # installs @supabase/supabase-js
npm i -g netlify-cli        # the Netlify CLI (if you don't have it)
netlify login               # opens the browser to authorize
netlify link                # link this repo to the Netlify site (child-carecenter)
```

Then, any time:

```bash
npm run dev                 # -> http://localhost:8888
```

Open `http://localhost:8888`, go to the admin portal via the footer "Staff Login" link,
and sign in with your Netlify Identity account. Data reads/writes hit the real Supabase
project (the same data the deployed site uses).

### Marketing pages only (no functions/auth needed)

For quick work on just the public pages, skip the CLI entirely:

```bash
npm run serve               # static server for site/  (or just open site/index.html)
```

The admin pages won't function this way (no Functions/Identity), but every marketing page
works.

## Deployment

Hosted on Netlify, auto-deploying on every push to `main`. Marketing pages ship as static
files; the admin portal runs on Netlify Functions + Identity. The Supabase URL and
service-role key live as Netlify environment variables — never committed to the repo and
never sent to the browser.

## Backlog (not built yet)

- Edit/delete for existing entries.
- Reporting/export (e.g. CSV, monthly summary).
- Support for more than one admin account.
- Wiring the contact form to Netlify Forms (field `name` attributes are already clean, so
  it's a drop-in change).
