# Vegetable Shop Manager Test Checklist

Run this checklist before every release.

## Build

- [ ] `npm install` completes
- [ ] `npm run build` passes
- [ ] `npm run desktop:dev` opens desktop app
- [ ] `npm run desktop:dist` creates installer/portable exe

## Basic UI

- [ ] Green UI theme loads on localhost
- [ ] Green UI theme loads in desktop app
- [ ] Green UI theme loads on deployed website
- [ ] Left sidebar is visible on desktop size
- [ ] Bottom nav works on mobile size
- [ ] Version badge is visible
- [ ] Offline/online badge is fully visible

## Billing

- [ ] Add vegetable to cart from quick button
- [ ] Quantity popup works
- [ ] Decimal quantity works, e.g. 1.5 kg
- [ ] Discount validation works
- [ ] Save bill works
- [ ] Save & Print works
- [ ] Receipt Preview works
- [ ] Stock reduces after sale
- [ ] Credit bill increases customer due

## Inventory / Rates / Purchase

- [ ] Add vegetable
- [ ] Edit vegetable
- [ ] Delete vegetable warning works
- [ ] CSV template downloads
- [ ] CSV import adds/updates vegetables
- [ ] Daily Rates save correctly
- [ ] Mandi Purchase increases stock
- [ ] Typed supplier name works

## Wastage / Returns / Cancellation

- [ ] Wastage reduces stock
- [ ] Bill cancellation restores stock
- [ ] Cancelled bill excluded from sales totals
- [ ] Partial item return restores correct quantity
- [ ] Return Report shows return
- [ ] Daily Closing includes returns

## Customers / Payments

- [ ] Add customer
- [ ] Customer due shown
- [ ] Payment reduces due
- [ ] Payment appears in reports/activity

## Reports

- [ ] Daily Closing Report loads
- [ ] Print Closing works
- [ ] Sales report shows active/cancelled status
- [ ] Customer ledger loads
- [ ] Supplier ledger loads
- [ ] Activity Log records key actions
- [ ] CSV exports work

## Desktop SQLite / Backup

- [ ] Settings shows SQLite database path
- [ ] SQLite table counts show data
- [ ] Add data, close app, reopen, data remains
- [ ] Backup SQLite DB creates `.db` file
- [ ] Choose Backup Folder works
- [ ] Automatic daily backup shows Done
- [ ] JSON backup downloads
- [ ] JSON restore works

## Owner PIN / Staff Mode

- [ ] Enable owner PIN
- [ ] PIN is required for protected tabs
- [ ] Staff allowed tabs work
- [ ] Unchecked tabs do not render behind PIN gate
- [ ] Lock Owner works
- [ ] Staff mode hides sensitive dashboard values

## Website Login / Roles

- [ ] Login page shows Owner / Manager / Staff options
- [ ] Supabase URL/key fields hidden when env vars exist
- [ ] Owner login works
- [ ] Manager login works
- [ ] Staff login works
- [ ] Staff cannot enter owner/manager mode
- [ ] Manager cannot enter owner mode
- [ ] Website logout works

## Team Invites

- [ ] Owner can create Staff invite
- [ ] Owner can create Manager invite
- [ ] Staff can accept invite and join shop
- [ ] Manager can accept invite and join shop
- [ ] Load Team Members works
- [ ] Change role works
- [ ] Remove member works
- [ ] Last owner cannot be removed

## Cloud Sync

- [ ] Cloud Health Check works
- [ ] Push Local Data to Cloud works
- [ ] Check Cloud Counts shows row counts
- [ ] Pull Cloud Data to Local creates backup first
- [ ] Sync Now works
- [ ] Auto Push works when enabled
- [ ] JWT refresh works after token expiry
- [ ] Sync History updates

## Recovery

- [ ] Error Boundary displays crash screen if a component throws
- [ ] Emergency Backup button downloads JSON
- [ ] Startup Recovery appears for corrupted localStorage
- [ ] Restore Backup from Startup Recovery works
- [ ] Reset to Demo from Startup Recovery works

## Release

- [ ] Version updated in `package.json`
- [ ] Version updated in `package-lock.json`
- [ ] Version updated in `src/lib/version.ts`
- [ ] Release notes added
- [ ] Git tag created
- [ ] GitHub Release created
- [ ] Desktop `.exe` uploaded to GitHub Release
