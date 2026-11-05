// Talha Bilal Store — order-auth (Phase 5 stub).
//
// This file used to wrap window.fetch and attach a customer JWT to
// create-order calls. Customer login was REMOVED by the user (2026-11-05 —
// Google Search Console flagged a security issue on the customer account
// pages), so there is no customer token any more: create-order accepts
// anonymous guest checkout and this wrapper is now a deliberate no-op.
// No page includes this file any more (index.html / products.html load
// without it); the file stays only so the removal is explicit in the repo.
