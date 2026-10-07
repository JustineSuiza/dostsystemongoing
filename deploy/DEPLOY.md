# Deployment Guide — DOST System

The frontend is deployed to **Firebase Hosting**. The old shared-hosting
(cPanel / InfinityFree) artifacts — `backend.zip`, `dost-system-db.sql`,
and the cPanel instructions — have been removed.

## Contents of this folder

| File | Description |
|---|---|
| `DEPLOY.md` | This guide — how to build and deploy the React frontend to Firebase Hosting. |

## Prerequisites

- Node.js 16+ and npm
- Firebase CLI (`npx --yes firebase-tools`) and an active login:
  ```powershell
  npx --yes firebase-tools login
  ```
- The project is already linked to Firebase project `justinez` (`.firebaserc`).

## Step 1 — Environment

Create/edit `frontend/.env.local` (gitignored):

```env
# Public URL of the backend API, no trailing slash.
# Leave empty only for local development (calls stay on http://localhost:8080).
REACT_APP_API_BASE_URL=https://YOUR-API-DOMAIN

REACT_APP_MAPBOX_TOKEN=pk....
```

`frontend/src/index.js` rewrites every `http://localhost:8080/...` call
(70+ call sites across 36 files) to `REACT_APP_API_BASE_URL` via axios and
fetch interceptors, so no code changes are needed.

> Firebase Hosting serves **static files only** — the CodeIgniter 4 backend
> (PHP + MySQL) must be hosted somewhere else (e.g. local XAMPP for
> development, or any PHP host), and its public URL goes in
> `REACT_APP_API_BASE_URL`.

## Step 2 — Build

```powershell
cd frontend
npm install
npm run build
```

## Step 3 — Deploy

From the repository root:

```powershell
npx --yes firebase-tools deploy --only hosting
```

The site is served from `frontend/build` (see `firebase.json`) with an SPA
rewrite of `**` to `/index.html`.

Live URL: `https://justinez.web.app`

## Notes

- **Never commit** `backend/justinez-firebase-adminsdk-*.json` or
  `backend/.env` (both gitignored).
- **Plaintext passwords** are stored in the `user` table (no `password_hash`)
  — known issue; plan a fix before a public launch.
- **Gmail SMTP** is hardcoded in `app/Config/Email.php` (requires a Gmail App
  Password). Password-reset links point to `frontend.baseURL`
  (`https://justinez.web.app/reset-password`).
- CORS is `Access-Control-Allow-Origin: *` (`app/Filters/Cors.php`) — tighten
  it if possible.
- Sessions: login state lives in the frontend's `localStorage`, so
  cross-domain auth is unaffected.
