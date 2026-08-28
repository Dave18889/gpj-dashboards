# Gartner T&E &amp; Stock Forecast

Your T&E dashboards (2026, 2027) and Stock Forecast dashboard (2026),
combined under one landing page. This is a brand new project — it doesn't
touch your existing separate deployments, so nothing breaks while you set
this up. Once this one is live and confirmed working, you can delete the
old separate ones.

---

## Step 1: Create a new GitHub repository

1. Go to [github.com](https://github.com) and log in
2. Click **+** → **New repository**
3. Name it something like `gpj-dashboards`
4. Click **Create repository**

## Step 2: Upload the files

1. Unzip the file I've provided
2. On the new repo's page, click **uploading an existing file**
3. Open the unzipped folder, select **everything inside it** — including
   the `2026`, `2027`, `stock2026`, `shippingNA`, `api`, and `lib` folders — and drag it
   all into the upload box
4. Commit

Your repo's top level should show: `2026`, `2027`, `stock2026`,
`shippingNA`, `api`, `lib`, `index.html`, `style.css`, `server.js`,
`middleware.js`, `package.json`, `.env.example`, `.gitignore`.

## Step 3: Import into Vercel

1. Vercel → **Add New → Project** → import this new repo
2. **Framework Preset**: Other
3. **Root Directory**: leave blank / `./`

## Step 4: Set environment variables

Before deploying, add these in the project settings (or after, under
**Settings → Environment Variables**):

| Name | Value |
|---|---|
| `GOOGLE_API_KEY` | your Google Cloud API key (same one you've used before) |
| `SPREADSHEET_ID_2026` | `1lMx9A-CVvae7iIinprtdVoE47N6FBf2ibDGuCUuevmc` |
| `SPREADSHEET_ID_2027` | `1_9iyAS18fYZTlY45AcSU2AdxtkKt_axpw5DnqKg0zHM` |
| `SPREADSHEET_ID_STOCK_2026` | `1R8Imdku0rMvWfd66ZKBafRZmnL1x0S-FAWstRLBK-QE` |
| `SPREADSHEET_ID_SHIPPING_NA` | `1hpTWfxspIxUEP2fVjBOAZHgElKL8zINtFSHHb8OA1OY` |

Note the names — each sheet gets its own `SPREADSHEET_ID_...` variable, since one
project now serves three sheets and they can't share a name.

**Each sheet needs to be individually shared** as "Anyone with the link –
Viewer" — including the Stock Tracker sheet, since it's brand new to this
API key even if you've shared the other two before.

Leave `SITE_USER` / `SITE_PASSWORD` unset for now — confirm everything
loads first, add a password afterward (same as before).

## Step 5: Deploy and check it

Click **Deploy**. Once it finishes, visit the site:
- The homepage shows a **T&E Forecast** section (2026, 2027) and a
  **Stock Forecast** section (2026 for now — 2027 will slot in the same
  way once that sheet exists)
- Clicking any card opens that dashboard, live data included
- Each dashboard has a "← All Years" button back to this homepage

If a dashboard doesn't load, check the browser console (F12 → Console tab)
and the Network tab for the actual error, same as before — most likely
culprit is a typo in one of the sheet IDs above, or a sheet's sharing
setting needing a recheck.

## Step 6 (optional): Add a password

Same as your other projects — add `SITE_USER` and `SITE_PASSWORD` in
**Settings → Environment Variables**, then redeploy. One login protects
the landing page and both dashboards together.

## Step 7: Retire the old separate projects (once confirmed working)

Once this combined version is live and both years are loading correctly,
you can delete the two old standalone Vercel projects and their GitHub
repos — everything they did now lives here.

---

## How it's organized

```
├── index.html / style.css        # Landing page
├── 2026/
│   ├── index.html / style.css / app.js
├── 2027/
│   ├── index.html / style.css / app.js
├── stock2026/
│   ├── index.html / style.css / app.js
├── shippingNA/
│   ├── index.html / style.css / app.js
├── api/
│   ├── 2026/te-forecast.js         # Reads the 2026 T&E sheet
│   ├── 2027/te-forecast.js         # Reads the 2027 T&E sheet
│   ├── stock2026/data.js           # Reads the 2026 Stock Tracker sheet
│   └── shippingNA/data.js          # Reads the NA Shipping sheet (+ 2026 T&E for names)
├── lib/
│   ├── 2026/sheets.js, parse.js      # 2026 T&E parsing logic
│   ├── 2027/sheets.js, parse.js      # 2027 T&E parsing logic
│   ├── stock2026/sheets.js, parse.js # 2026 Stock Tracker parsing logic
│   └── shippingNA/sheets.js, parse.js # NA Shipping parsing logic
├── server.js                           # Optional local dev (all four)
├── middleware.js                         # Optional shared password
└── package.json
```

Each dashboard is a fully separate set of files, so adding the 2027 Stock
Forecast later is the same pattern as everything else here: a new
`stock2027` folder, a new `api/stock2027/data.js`, a new
`SPREADSHEET_ID_STOCK_2027` variable — nothing existing needs to change.
