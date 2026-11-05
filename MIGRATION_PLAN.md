# TalhaBilalStore Backend Migration Plan

## Goal
Prepare a Supabase-independent backend before the Supabase grace period ends, while keeping the existing storefront and admin panel UI/behaviour unchanged.

## Safety rules
- This branch is isolated: migration/cloudflare-backend.
- Do not change, merge, deploy, or point the live domain at this branch during development.
- Do not edit the current production branch feature/free-cod-store as part of this migration.
- Preserve all existing orders, order statuses, COD checkout behaviour, customer notes, finance calculations, CMS content, reviews, SEO, Meta Pixel/CAPI behaviour, and admin permissions.
- Never put database credentials, signing secrets, Meta access tokens, or other server secrets in browser code or Git.
- Keep the current Supabase project intact as the rollback source until post-cutover verification is complete.

## Initial repository and backend inventory (read-only inspection)
- Existing storefront/admin are static HTML/JS/CSS with Cloudflare Pages Functions.
- The repo already has a Node/Express server.js and Pages Functions under functions/.
- Supabase is used by browser code and server-side Edge Functions.
- Supabase Edge Functions observed: create-order, admin-orders, track-order, submit-review, customer-account, login-by-phone, cms-data, purchase-data, cms-manage, cms-public.
- Existing Supabase function source is present for several CMS/order handlers under supabase/functions/.
- The CMS includes products, categories, pages, banners, blog posts, reviews, FAQs, media, promotions, SEO, redirects, settings and audit logs.
- Orders and finance are separate business-critical data domains and must be mapped explicitly before schema migration.

## Target architecture (proposed)
- Cloudflare Pages: keep serving the current website files and existing URLs.
- Cloudflare Workers / Pages Functions: replace Supabase Edge Functions with server-side API handlers.
- Cloudflare D1: candidate relational store for application data, subject to a full PostgreSQL-to-SQLite compatibility review. If D1 cannot preserve required behaviour safely, select a managed PostgreSQL replacement rather than forcing a risky conversion.
- Cloudflare R2: object storage for media, served through the site's CDN/custom domain.
- Admin authentication: replace Supabase Auth only after documenting current admin/customer login flows, password/session handling, roles, and account recovery. Use a secure established auth implementation; do not create a weak password system.
- GitHub: source control and separate deployment/testing branch only.

## Required migration work
1. Complete the separate image migration already in progress; verify every CMS media URL and every public page.
2. Inventory all database tables, columns, indexes, constraints, triggers, views, RPCs, RLS policies, storage buckets/policies, auth users/roles, and Edge Function request/response contracts.
3. Map every existing browser/API call to its replacement endpoint.
4. Export and back up all data; record row counts and key totals before migration.
5. Build the new schema and API on this branch only.
6. Migrate a copy of data and verify row counts, order IDs, statuses, totals, finance records, product/catalog content and relationships.
7. Run end-to-end tests for guest COD checkout, customer account/login, admin login/roles, order edits/notes/statuses, courier imports, finance, CMS CRUD, reviews, tracking, sitemap/SEO, and Meta integrations.
8. Perform a controlled cutover only after explicit go-ahead and a final backup. Keep Supabase available for rollback until the new system is proven stable.

## Not in scope
- No redesign or admin UI changes.
- No product, pricing, copy, SEO URL, checkout, order workflow, finance formula, or tracking changes unless strictly required for backend compatibility and separately reviewed.
- No deletion or disabling of the Supabase project during preparation.

## Go-live acceptance criteria
- Existing admin panel looks and behaves the same.
- All historical orders and finance data reconcile exactly.
- New COD orders can be created and viewed/updated correctly.
- Authentication and authorization tests pass; no privileged keys reach the browser.
- All storefront/CMS pages, media, reviews, tracking and SEO endpoints work.
- Rollback has been rehearsed and the old Supabase project remains untouched until acceptance.
