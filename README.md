# Vegetable Shop Manager

## Version

Current version: **2.2.1**


A fresh rebuilt browser-based shop management app specifically for vegetable shops.

## Features

- Fast vegetable billing / POS
- Hindi + English interface
- Hindi receipt printing
- kg, gram, piece, dozen, bunch, crate units
- Daily mandi purchase entry
- Writable or selectable supplier name during purchase
- Daily rate update screen
- Quick billing vegetable buttons
- Billing keyboard shortcuts
- Delete button for vegetables
- Automatic stock increase on purchase
- Automatic stock deduction on sale
- Wastage / damaged stock tracking
- Customer udhaar / credit balance
- Customer payment tracking
- Supplier records
- Low stock alerts
- Daily dashboard
- Sales, purchase, profit and stock reports
- CSV export
- Full JSON backup and restore
- Offline browser storage
- Phone and computer responsive UI

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Important

The app currently stores data in the browser using localStorage. Use Settings -> Backup regularly.

Recommended future upgrade: IndexedDB + PWA install + optional cloud backup.
