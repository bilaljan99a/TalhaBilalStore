DESCRIPTION IMAGES — GITHUB UPLOAD PACK (Phase 6)
=================================================
These are the last 42 Supabase-only product description images. After this
upload, ZERO product images remain on Supabase Storage.

WHAT'S IN THIS FOLDER
- 42 image files, flat names: <product-slug>-desc-NN.<ext>
  (e.g. tds-water-quality-tester-pen-desc-01.jpg)
  .jfif/.jpeg were normalised to .jpg; two fridge-lock files stored as
  .png were actually JPEG bytes and were renamed to .jpg.
  The 3 GIFs (320x569, ~3.4-3.9 MB) are the description demo GIFs for the
  fridge lock, epilator and scalp comb — already live today, do NOT
  recompress them.
- manifest.csv — one row per Supabase description URL (56 rows):
  42x source=download (the files in this folder) and 14x source=reuse-*
  (those 14 files are ALREADY in GitHub assets/ from shifts 1-3 — same
  Supabase file was also a gallery/banner image — do NOT upload them again).
- desc-url-rewrites.json — the old-URL -> /assets/... mapping that
  migrate.mjs applies with --apply-desc-rewrites.

HOW TO UPLOAD (GitHub web — the user's step, same as shifts 1-3)
1. Open github.com/bilaljan99a/TalhaBilalStore, branch
   feature/free-cod-store, folder assets/.
2. "Add file" -> "Upload files" and drag in the 42 files from this folder
   (NOT the manifest, NOT this README). Commit directly to
   feature/free-cod-store.
3. Confirm all 42 appear under assets/ (e.g.
   https://github.com/bilaljan99a/TalhaBilalStore/blob/feature/free-cod-store/assets/tds-water-quality-tester-pen-desc-01.jpg).

WHAT HAPPENS AFTER THE UPLOAD
- Run the migration with the rewrite flag (local, no live writes):
    node migrate.mjs --db ./test.db --backup ./fresh-backup-2026-11-05 --apply-desc-rewrites
  That rewrites all 56 Supabase description URLs to /assets/... inside the
  migrated D1 data. Verified in Phase 6: 38 products touched, 0 Supabase
  URLs remain in descriptions, migration verification PASSED.
- The 2 remaining Supabase Storage objects (review-images bucket) are
  handled separately — submit-review was dropped, so there is no review
  uploader anymore; see PHASE6-NOTES.md.

DO NOT
- Upload via the CMS uploader (it writes to Supabase Storage) — GitHub
  assets/ ONLY, per the firm image rule.
- Rename the files — the D1 rewrite mapping expects these exact names.
