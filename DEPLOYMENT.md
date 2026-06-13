# Website Deployment Guide

This app can be deployed as a browser web app, but remember:

- Desktop app uses SQLite local database.
- Website/browser mode uses browser localStorage unless Cloud Sync is used.
- Website and desktop only share data through Supabase Cloud Sync.

## Recommended hosting

Use Vercel.

## Deploy to Vercel

### 1. Push latest code to GitHub

```bash
git add .
git commit -m "Prepare website deployment"
git push origin main
```

### 2. Import project in Vercel

Go to:

```text
https://vercel.com/new
```

Select:

```text
DyNATgIT/shop-management
```

Vercel should detect Vite automatically.

Settings:

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

The included `vercel.json` already sets these.

### 3. Deploy

Click:

```text
Deploy
```

## After deployment

Open the deployed URL.

You will see a browser mode warning on Dashboard.

To use cloud data on the website:

1. Go to Settings.
2. Enter Supabase URL and anon key.
3. Sign in.
4. Enter/connect Cloud Shop ID.
5. Use Pull Cloud Data to Local to load cloud data into that browser.

## Important data behavior

### Desktop

```text
SQLite database + local backups
```

### Website

```text
Browser localStorage + Supabase sync if configured
```

### Sync

```text
Desktop <-> Supabase <-> Website
```

Manual sync steps:

- Desktop: Push Local Data to Cloud or Sync Now.
- Website: Pull Cloud Data to Local.

Auto-push is intended mainly for desktop.

## Environment variables

Currently none are required because Supabase URL/key are entered inside app Settings.

Later we may move public Supabase config to environment variables.

## Security notes

- Never put Supabase `service_role` key in the app or Vercel.
- Use only the Supabase `anon public` key.
- Supabase Row Level Security must stay enabled.
- Owner PIN is local UI protection, not cloud authentication.
