# Vegetable Shop Manager v2.2.1

Patch release focused on stability and production safety.

## Added

- Error Boundary recovery screen for runtime crashes.
- Emergency backup export from crash screen.
- Safe Startup Recovery screen for corrupted/missing local data.
- Restore backup option from startup recovery.
- Reset-to-demo option from startup recovery.
- App version badge in the UI.
- Stylesheet fallback via `src/index.css` importing `src/styles.css`.
- Header badge clipping fix for version/offline/mode labels.

## Fixed

- Website CSS/static asset loading issue caused by Vercel rewrite config.
- Sidebar/header badge visibility after adding version label.
- Safer startup behavior when localStorage is corrupted or incomplete.

## Notes

- No thermal printer-specific changes in this release.
- No UPI QR generation changes in this release.
- Website requires Vercel env variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
