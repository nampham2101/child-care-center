# Admin Portal Implementation Plan

Staged breakdown of the admin portal work described in [`CLAUDE.md`](../CLAUDE.md)
("Admin Portal Details"). The marketing site is already built; this covers the
login-protected income/expense tool only. Work through the stages in order — each
one depends on the stage before it.

## Stage 0 — Prerequisites (you, not Claude)

**Goal:** accounts and config exist for later stages to build on. These steps happen
in Netlify's/Supabase's own dashboards and can't be done by Claude directly.

- [x] Create (or connect) a Netlify site for this repo
- [x] Create a Supabase project (free tier)
- [x] Set Netlify environment variables for the Supabase URL and service key (never
      committed to the repo, never sent to the browser)
- [x] Enable Netlify Identity on the site
- [x] Invite yourself as the sole admin account (registration closed to the public)

**Note:** the env vars were actually created as `MY_SUPABASE_URL` and
`MY_SUPABASE_SERVICE_ROLE_KEY` (custom prefix, not the plain names). Stage 3's
functions must read `process.env.MY_SUPABASE_URL` / `process.env.MY_SUPABASE_SERVICE_ROLE_KEY`
to match.

## Stage 1 — Supabase schema

**Goal:** a table to store income/expense entries.
**Depends on:** Stage 0 (Supabase project exists).

- [ ] Create an `entries` table with columns: `id`, `type` (`income`/`expense`),
      `amount`, `category`, `date`, `note` (nullable), `created_at`
- [ ] Confirm the table is reachable from the Supabase dashboard's table editor / SQL
      console

## Stage 2 — Netlify Identity gate

**Goal:** every admin page requires a valid logged-in session; anyone else is
redirected to login.
**Depends on:** Stage 0 (Identity enabled).

- [ ] `site/admin/login.html` — Netlify Identity widget, redirects to
      `site/admin/index.html` once logged in
- [ ] `site/admin/index.html` — checks for a valid Identity session on load;
      redirects to `site/admin/login.html` if none
- [ ] `site/admin/records.html` — same session check as above
- [ ] Confirm none of the three admin pages are linked from the public site's main
      nav (only the existing footer "Staff Login" link points here — it already
      resolves correctly to `admin/login.html` relative to the `site/` pages)

## Stage 3 — Netlify Functions

**Goal:** server-side reads/writes to Supabase, auth-checked, so the Supabase key
never reaches the browser.
**Depends on:** Stage 1 (schema exists), Stage 2 (Identity sessions to check against).

- [ ] `netlify/functions/add-entry.js` — insert one income/expense record; rejects
      requests without a valid Identity session
- [ ] `netlify/functions/get-entries.js` — fetch entries, optionally filtered by
      category/date range; same auth check
- [ ] Add `@netlify/functions` and `@supabase/supabase-js` as real dependencies in
      `package.json` (currently a placeholder with none)

## Stage 4 — Dashboard UI (`site/admin/index.html`)

**Goal:** the admin can add an entry and see where the center stands financially.
**Depends on:** Stage 3 (functions to call).

- [ ] Form to add an income or expense entry (amount, category, date, optional note),
      calling `add-entry`
- [ ] Running totals: total income, total expenses, profit (income − expenses), from
      `get-entries`

## Stage 5 — Records UI (`site/admin/records.html`)

**Goal:** the admin can review and filter past entries.
**Depends on:** Stage 3 (functions to call).

- [ ] List entries fetched from `get-entries`
- [ ] Filter by category
- [ ] Filter by date range (e.g. this month, custom range)

## Stage 6 — End-to-end verification

**Goal:** confirm the whole flow actually works, not just that the code compiles.
**Depends on:** Stages 2–5.

- [ ] Logged-out visit to any `site/admin/*` page redirects to login
- [ ] Logging in as the invited admin reaches the dashboard
- [ ] Adding an entry persists it in Supabase and updates the running totals
- [ ] Records page filters (category, date range) return correct results
- [ ] Browser network tab / page source never exposes the Supabase service key

## Stage 7 — Backlog (explicitly future, not in current scope)

Per `CLAUDE.md`'s "Open Items" — do not build these until asked:

- [ ] Edit/delete for existing entries
- [ ] Reporting/export (e.g. CSV, monthly summary)
- [ ] Support for more than one admin account
