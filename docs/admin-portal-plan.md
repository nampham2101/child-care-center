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

- [x] Create an `entries` table with columns: `id`, `type` (`income`/`expense`),
      `amount`, `category`, `date`, `note` (nullable), `created_at`
- [x] Confirm the table is reachable from the Supabase dashboard's table editor / SQL
      console

**Note:** project is `sunny-child-care-center` (id `efamdmirterdenalxfkv`, region
`ap-south-1`). RLS is now enabled on `entries` with zero policies (deny-by-default
for `anon`/`authenticated`); only Netlify Functions using the `service_role` key
(which bypasses RLS) can read/write. Supabase's advisor confirms this is the
expected "RLS enabled, no policy" state, not an error.

## Stage 2 — Netlify Identity gate

**Goal:** every admin page requires a valid logged-in session; anyone else is
redirected to login.
**Depends on:** Stage 0 (Identity enabled).

- [x] `site/admin/login.html` — Netlify Identity widget, redirects to
      `site/admin/index.html` once logged in
- [x] `site/admin/index.html` — checks for a valid Identity session on load;
      redirects to `site/admin/login.html` if none
- [x] `site/admin/records.html` — same session check as above
- [x] Confirm none of the three admin pages are linked from the public site's main
      nav (only the existing footer "Staff Login" link points here — it already
      resolves correctly to `admin/login.html` relative to the `site/` pages)

**Note:** all three pages share `site/admin/admin.css` (layout) and
`site/admin/admin-auth.js` (the session-check/redirect/logout logic used by
`index.html` and `records.html`); `login.html` inlines its own init/login
listeners. The Identity widget is pointed at the real site
(`https://child-carecenter.netlify.app/.netlify/identity`) via a `<link
rel="identity.netlify.com">` tag in each page's `<head>`, so it resolves
correctly even when testing from `localhost`.

**Verified end-to-end** on the live site (`child-carecenter.netlify.app`) in a
real Chrome browser: logged-out visit to `admin/index.html` redirects to
`admin/login.html`; logging in via the widget redirects to the dashboard;
session persists across `admin/index.html` and `admin/records.html` with no
re-login; Log Out redirects back to the login page. (The sandboxed local
preview browser couldn't confirm this — cross-origin cookies/iframes behave
differently in headless automation — but a real browser confirms it works.)

Also discovered and fixed along the way: Netlify's invite/password-recovery
emails link to the site's homepage by default, so `site/index.html` now loads
the Identity widget too (inert for ordinary visitors, only activates for
invite/recovery tokens in the URL) — otherwise clicking the invite email would
land on a page with no way to complete signup.

## Stage 3 — Netlify Functions

**Goal:** server-side reads/writes to Supabase, auth-checked, so the Supabase key
never reaches the browser.
**Depends on:** Stage 1 (schema exists), Stage 2 (Identity sessions to check against).

- [x] `netlify/functions/add-entry.mjs` — insert one income/expense record; rejects
      requests without a valid Identity session
- [x] `netlify/functions/get-entries.mjs` — fetch entries, optionally filtered by
      category/date range; same auth check
- [x] Add `@supabase/supabase-js` as a real dependency in `package.json` (see note
      on `@netlify/functions` below)

**Endpoints (default paths):** `/.netlify/functions/add-entry` (POST) and
`/.netlify/functions/get-entries` (GET, optional `?category=&from=&to=`). Shared
Supabase-client / auth / JSON-response helpers live in
`netlify/functions/lib/helpers.mjs`.

**Key implementation notes / gotchas hit during Stage 3:**
- **Function format matters for auth.** The functions MUST use the v1 handler
  signature (`export const handler = async (event, context)`), not the modern v2
  `export default` format. Netlify only populates `context.clientContext.user`
  (the validated Identity JWT → the whole auth gate) for handler-style functions.
  With v2 `export default`, `clientContext` is absent and every request 401s.
- **`@netlify/functions` was NOT added.** It only provides TypeScript types, and
  these functions are plain-JS ESM (`.mjs`) — an unused dep. Add it only if these
  are ever converted to TypeScript.
- **Env var values were wrong at first.** `MY_SUPABASE_SERVICE_ROLE_KEY` had a
  20-char non-key value and `MY_SUPABASE_URL` had extra characters; Supabase
  returned "Invalid API key" until corrected to the real `service_role` secret and
  the bare `https://efamdmirterdenalxfkv.supabase.co`. Env-var changes only take
  effect on a redeploy. Functions read them via `Netlify.env.get(...)`.
- **Auth is cookie-or-header.** A logged-in browser sends the `nf_jwt` cookie, so
  same-origin `fetch` calls authenticate even without a manual `Authorization`
  header. Stage 4/5 can rely on that, but explicitly sending
  `Authorization: Bearer <netlifyIdentity.currentUser().jwt()>` also works.

**Verified end-to-end on the live site:** authenticated insert → 201 with the row;
read-back → 200 with the entry; validation rejects bad `type` / negative `amount`
(400) and wrong method (405); category/date-range filters return correct rows;
truly unauthenticated requests (curl, no cookie) → 401 for both functions. Test
row was cleaned up afterward, so the `entries` table is empty going into Stage 4.

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
