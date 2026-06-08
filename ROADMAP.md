# Shop Management Roadmap

Goal: build a simple Vyapar/myBillBook-like shop app for Indian small shops with Hindi support, offline usage, daily stock update, and billing.

## Completed in this working copy

- Shared localStorage data store (`src/lib/store.tsx`)
- English/Hindi language toggle
- Inventory persistence
- Billing that deducts stock automatically
- Purchase entry that increases stock automatically
- Stock adjustment for damaged/expired/returned items
- Customer due balance update for credit/unpaid bills
- Payment recording that reduces customer due balance
- Dashboard and reports based on real sales/inventory data
- Shop settings used on invoices
- TypeScript config added and production build verified

## Recommended next phase

1. **Better invoice printing**
   - A4 GST invoice template
   - 58mm/80mm thermal print layout
   - Hindi font support in PDF

2. **Barcode/QR support**
   - Product barcode field
   - Barcode scanner input on billing screen
   - UPI QR on invoice/receipt

3. **Real database / sync**
   - Keep offline-first local IndexedDB
   - Optional Supabase/Firebase backend for backup and multi-device sync

4. **Authentication and roles**
   - Owner login
   - Staff login with billing-only permission

5. **Exports and backups**
   - CSV/Excel export for products, sales, purchases
   - Daily auto-backup file
   - Restore from backup

6. **Accounting features**
   - Profit report
   - Supplier ledger
   - Customer ledger
   - GST report by tax slab

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
