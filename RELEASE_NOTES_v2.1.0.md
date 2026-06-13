# Vegetable Shop Manager v2.1.0

## Major additions since v2.0.0

### Desktop + database
- Added Electron desktop SQLite storage.
- Added normalized SQLite tables for future cloud sync.
- Added SQLite database status and table counts.
- Added automatic daily SQLite backup.
- Added custom backup folder selection.

### Cloud sync foundation
- Added Supabase schema.
- Added cloud sync settings UI.
- Added sign up / sign in.
- Added create/connect cloud shop.
- Added push local data to cloud.
- Added pull cloud data to local.
- Added Sync Now flow.
- Added auto-push option.
- Added cloud health check and cloud row counts.
- Added sync history and troubleshooting controls.

### Security
- Added owner PIN lock.
- Added hashed PIN storage.
- Added staff mode permissions.
- Protected Reports and Settings behind owner PIN.

### Billing / reports
- Added bill cancellation flow.
- Added partial item return flow.
- Added return report.
- Updated daily closing report to include returns.
- Updated profit calculations to account for returns.

### UI / receipt
- Improved app UI theme.
- Improved receipt preview and print layout.
- Added UPI placeholder settings.
- Added backup reminders.

## Notes

- Cloud sync is currently manual-first with optional auto-push.
- Auto-pull is intentionally disabled for safety.
- Pull creates a SQLite backup before overwriting local data.
- Thermal printer-specific optimization is still on hold until printer specs are available.
