# Vegetable Shop Manager v2.2.0

## Major additions since v2.1.0

### Website deployment and web mode

* Added Vercel deployment configuration.
* Added website/browser mode warning.
* Added deployment guide.
* Website login now uses Vercel/Vite environment variables for Supabase URL and anon key.
* Removed Supabase technical fields from normal production login page.

### Website role-based login

* Added role selection login page:

  * Owner Login
  * Manager Login
  * Staff Login
* Website role is validated using Supabase `shop\_users.role`.
* Owner can enter owner/manager/staff mode.
* Manager can enter manager/staff mode.
* Staff can enter staff mode only.
* Removed viewer mode.

### Team invites and role management

* Added manager/staff invite codes.
* Added `shop\_invites` Supabase table.
* Added invite RPCs:

  * `create\_shop\_invite`
  * `accept\_shop\_invite`
* Added Team Invites UI.
* Added Team Members management.
* Owner/manager can load team members.
* Owner/manager can change roles.
* Owner/manager can remove users, with protection against removing the last owner.

### Security improvements

* Website now uses Supabase Auth + shop role instead of local PIN.
* Desktop still uses owner PIN for local counter security.
* Added hashed owner PIN storage.
* Added configurable staff tab access for desktop.
* Added strict staff mode fix so protected tabs cannot render behind the PIN gate.
* Added safer website settings: desktop-only SQLite/backup/security controls are hidden on website.
* Added role-aware Supabase RLS policies for owner/manager/staff.

### Cloud sync improvements

* Added cloud health check.
* Added cloud row counts check.
* Added sync history/status logging.
* Added automatic cloud push option.
* Added safer pull with SQLite backup before local overwrite.
* Added cloud sync troubleshooting controls.
* Added cloud setup checklist.
* Added session refresh for expired Supabase JWT.

### Returns and audit

* Added partial item return flow.
* Added Return Report.
* Updated Daily Closing Report to include returns.
* Updated sales/profit calculations to account for returns.
* Added Activity/Audit Log with CSV export.

### Inventory import

* Added vegetable CSV import.
* Added downloadable import template.
* Import updates existing vegetables by name or adds new ones.

### Codebase

* Refactored large `App.tsx` into components and libraries.
* Added separate modules for cloud sync, security, dashboard, billing, reports, settings, etc.

## Notes

* Thermal printer-specific optimization is still on hold until printer model/specs are available.
* Real UPI QR generation is still on hold until UPI details/QR requirements are finalized.
* Website and desktop share data through Supabase sync; desktop remains SQLite-first.
* Auto-pull is intentionally disabled for safety.

