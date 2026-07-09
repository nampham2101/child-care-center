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

- [x] Form to add an income or expense entry (amount, category, date, optional note),
      calling `add-entry`
- [x] Running totals: total income, total expenses, profit (income − expenses), from
      `get-entries`

**Files:** the dashboard markup lives in `site/admin/index.html`; logic in
`site/admin/dashboard.js`; a shared function client in `site/admin/admin-api.js`
(reused by Stage 5). The client always sends `Authorization: Bearer
<currentUser().jwt()>` so it works identically on the deployed site and under
`netlify dev`. Category field is a free-text input with a `<datalist>` of common
suggestions (tuition, supplies, payroll, utilities, food, maintenance), matching
CLAUDE.md's "editable list, not a fixed enum."

**Tested locally via `netlify dev` (no Netlify deploy consumed):**
- Ran the linked site locally with `netlify dev` (env vars pulled from the linked
  Netlify project). `netlify dev` decodes a JWT's payload without verifying the
  signature, so a locally-crafted Identity token authenticates against the local
  functions — enabling a full automated test without a real login round-trip.
- Backend through the local server (curl): unauthenticated → 401; authenticated
  insert (income + expense) → 201; read-back and category/date filters correct.
- Dashboard UI in a browser: renders correctly (totals cards + add-entry form);
  submitting the form inserts the entry and refreshes the totals to the right
  figures (e.g. income $1,000.00, expenses $350.00, profit $650.00 in green/coral);
  form resets and date defaults to today; the error branch shows a red status
  message when a call fails. All test rows were cleaned from Supabase afterward
  (table empty going into Stage 5).

**Local-dev setup notes:** `netlify login` + `netlify link --id <site-id>` links
this repo to the Netlify project; `.claude/launch.json` has a `netlify-dev` config
so the preview tooling can run it on port 8888. The real-Chrome automation blocks
`localhost`/`127.0.0.1`, so local browser testing uses the preview browser instead.
None of `netlify login`/`link`/`dev` consume build/bandwidth/function quota.

## Stage 5 — Records UI (`site/admin/records.html`)

**Goal:** the admin can review and filter past entries.
**Depends on:** Stage 3 (functions to call).

- [x] List entries fetched from `get-entries`
- [x] Filter by category
- [x] Filter by date range (e.g. this month, custom range)

**Files:** markup in `site/admin/records.html`; logic in `site/admin/records.js`
(reuses `admin-api.js`). A filter bar (category `<datalist>` + From/To dates, with
**This Month** and **Clear** shortcuts) drives `get-entries`; results render into a
color-coded table (Date, Type, Category, Amount, Note) sorted newest-first, above a
live summary line (count + filtered income/expenses/profit). Table cells are built
with `textContent` (no `innerHTML`) so entry text can't inject markup. Empty results
show a "No entries found." state.

**Tested locally via `netlify dev`** (same crafted-token method as Stage 4; no
deploy consumed). Seeded 5 entries across two months/several categories, then
verified in the preview browser: unfiltered list shows all 5 sorted by date with a
correct summary; category filter (tuition → 2); **This Month** sets the July range
and returns only the 3 July rows (June excluded); Clear resets to all 5 and empties
the fields; a no-match filter shows the empty state with a zeroed summary. Test rows
cleaned from Supabase afterward (table empty).

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
