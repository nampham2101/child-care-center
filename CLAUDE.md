# Child Care Center Website — Project Instructions

## Overview
Two parts to this project:
1. **Marketing site** — static, content-driven pages so parents can learn about the center, its programs, and how to enroll/contact.
2. **Admin portal** — a login-protected area for staff to log income/expenses and see profit. Single admin account only (no multi-user roles for now).

## Tech Stack
- **Public marketing pages**: Plain HTML, CSS, and vanilla JS. No framework, no build step. Multi-page site — each page is its own `.html` file.
- **Admin portal**: Netlify Functions (serverless) for reading/writing financial data + Netlify Identity for login. This keeps everything deployable from the same Netlify site with no separate server to manage.
- **Database**: Supabase (hosted Postgres, free tier) for storing income/expense records. Netlify Functions call Supabase via its REST/JS client — the browser never talks to Supabase directly, so the DB key stays server-side only.
- Rationale: keeps the marketing site as simple static files (fast, cheap, easy to hand-edit) while isolating the "app-like" part (auth + data) in serverless functions, all still deployed via Netlify with no custom server infra.
- Optional: Tailwind via CDN `<script>` is fine for styling speed, but hand-written CSS in a shared `styles.css` is equally acceptable — pick one approach and stay consistent across pages.

## Pages (site map)
Public marketing pages:
- `index.html` — Home
- `about.html` — About the center (mission, staff, philosophy)
- `programs.html` — Programs / age groups
- `tuition.html` — Tuition & enrollment info
- `contact.html` — Contact page

Admin portal (separate folder, e.g. `/admin`):
- `admin/login.html` — Login page (Netlify Identity widget)
- `admin/index.html` — Dashboard: add income/expense entry, running totals, profit
- `admin/records.html` — List/filter entries by category and date range

Shared elements (header nav, footer) on the **public** pages should be visually consistent across all pages. Since there's no templating engine, keep header/footer markup identical across files and update all copies when changing nav. The admin portal has its own simple layout (not part of the public nav) — it should not be linked from the public site's main navigation, though a small unobtrusive "Staff Login" link (e.g. in the footer) is fine.

## Admin Portal Details

### Authentication
- Netlify Identity, restricted to exactly one admin account (invite-only, no public signup).
- All `admin/*` pages and all Netlify Functions that touch financial data must check for a valid Identity session before doing anything — reject/redirect to login otherwise.
- Treat this as a **lightweight internal tool**, not a production financial system: Netlify Identity's built-in auth is enough (no custom password hashing, no 2FA) since it's a single trusted user. Still, always serve admin pages over HTTPS (Netlify default) and never expose the Supabase service key to the browser.

### Data model (income/expense entries)
Each entry stored in Supabase should have at minimum:
- `id`
- `type` — `income` or `expense`
- `amount`
- `category` — e.g. `tuition`, `supplies`, `payroll`, `utilities` (keep an editable list, doesn't need to be a fixed enum yet)
- `date`
- `note` (optional free text)
- `created_at`

### Features (initial scope)
- Add a new income or expense entry (amount, category, date, optional note).
- View running totals: total income, total expenses, and profit (income − expenses).
- Filter/view entries by category and by date range (e.g. this month, custom range).
- Editing/deleting entries is **not** in scope yet — flag as a likely next step once the basics are working.

### Netlify Functions (suggested)
- `add-entry` — insert a new income/expense record (auth-checked).
- `get-entries` — fetch entries, optionally filtered by category/date range (auth-checked).
- Keep functions small and single-purpose; this can grow into edit/delete functions later.

## Content Status
- All center-specific content (name, address, phone, staff names, photos, tuition numbers) is **placeholder** for now.
- Use clearly fake but realistic placeholders (e.g. "Sunny Days Child Care Center", "123 Main St, Anytown"), and photos from a free stock source or simple CSS placeholder blocks — flag any placeholder image so it's easy to find/replace later.
- When real content is provided, swap it in directly rather than restructuring pages, unless the new content requires structural changes.

## Design / Tone
- Warm and playful: bright, friendly color palette (not corporate/clinical), rounded corners, friendly sans-serif fonts, approachable imagery/illustration style.
- Should still read as trustworthy and professional — this is a business parents are trusting with their kids, so avoid anything too cluttered or childish to the point of looking unprofessional.
- Mobile-responsive by default — many parents will browse on phones.

## Contact Form
- Contact page should include a form UI (name, email, phone, message, child's age) but it does **not** need to actually submit anywhere yet — placeholder/non-functional for now.
- When ready to go live, the plan is to wire it to Netlify Forms (just requires adding `data-netlify="true"` and a hidden input — minimal markup change, no backend code needed). Keep form field `name` attributes clean/simple now so this is a drop-in change later.

## Hosting / Deployment
- Target: Netlify, for both the public site and the admin portal (single site, single deploy).
- Public pages stay plain static files (HTML/CSS/JS/images) at the repo root or in a clearly named folder (e.g. `/site`), deployable via drag-and-drop or Git integration with zero config.
- The admin portal requires Netlify's build/deploy pipeline (for Netlify Functions + Identity) — this is the one deliberate exception to "no build step," scoped only to `/admin` and `/netlify/functions`. Public marketing pages should still not depend on any build step.
- Netlify Identity must be enabled on the site, with the admin invited as the sole user (no public signup).
- Supabase project URL/keys are environment variables in Netlify (never committed to the repo, never sent to the browser).

## Coding Conventions
- Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, etc.).
- Accessibility basics: alt text on images, proper heading hierarchy, sufficient color contrast, labeled form fields.
- Keep JS minimal on public pages — only for things like mobile nav toggle; no dependencies unless there's a real need.
- One shared `styles.css` for all public pages (unless using Tailwind CDN instead). Admin portal can share the same stylesheet or use its own minimal styling — consistency with the public brand (colors/fonts) is nice-to-have, not required.
- Never log or expose amounts/entries in client-side code beyond what the logged-in admin needs to see.

## Open Items / Future Decisions
- Real center name, branding, colors, logo, and copy — pending from user.
- Whether to eventually add a blog/news section (not in scope now).
- Wiring up the live contact form once hosting is finalized.
- Edit/delete for financial entries, and any reporting/export (e.g. CSV, monthly summary) — likely next steps after the basic admin flow works.
- Whether to ever support more than one admin account — current assumption is single-admin only; revisit if staffing changes.
