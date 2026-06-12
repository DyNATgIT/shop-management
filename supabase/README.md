# Supabase Setup

This folder contains the cloud database schema for future hybrid sync.

## How to use later

1. Create a Supabase project.
2. Open Supabase Dashboard -> SQL Editor.
3. Paste and run `schema.sql`.
4. Create an owner user in Supabase Auth.
5. Create a shop row and a `shop_users` membership row.
6. Add Supabase URL and anon key to the app when cloud sync is implemented.

## Current status

This schema is preparation only. The app does not sync to Supabase yet.

Current app storage:

- Desktop: SQLite + JSON app_state + normalized local tables
- Browser: localStorage
- Cloud: not connected yet
