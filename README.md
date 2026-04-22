# AR QR Tool — v2 (Multi-experience, Cloud-backed)

What changed from v1:
- **No more IndexedDB** — uploads now go to the cloud, so what you upload from your laptop works for every client on every device.
- **Multiple experiences** — each one gets its own QR code. Scan QR A, see video A. Scan QR B, see video B. Works for 10 or 10,000 experiences. 100 simultaneous users won't collide because each device only loads what its own QR points to.
- **Per-experience admin** — list, pause, delete, regenerate QR.

---

## What you need

- A free **Supabase** account (database + file storage)
- A free **Vercel** account (hosts the website)
- A **GitHub** account (Vercel reads the code from here)

Total cost: ₹0 for the scale you described.

---

## SETUP — do this once

### Step 1: Create a Supabase project (5 min)

1. Go to **https://supabase.com** → "Start your project" → sign in with GitHub or Google.
2. Click **"New Project"**.
   - Name: anything, e.g. `ar-qr-tool`
   - Database password: it'll auto-generate one. **Copy it to a notes file** (you won't need it for this tool, but keep it safe).
   - Region: pick the one closest to your clients (for India: `Mumbai` or `Singapore`).
   - Plan: **Free**.
3. Click "Create new project" and wait ~2 minutes for it to spin up.

### Step 2: Create the database table (1 min)

1. In your Supabase project, click **"SQL Editor"** in the left sidebar.
2. Click **"New query"**.
3. Open the file `supabase-setup.sql` from this project, copy ALL of it, paste it into the SQL editor.
4. Click **"Run"** (bottom right). You should see "Success. No rows returned."

### Step 3: Create the storage bucket (1 min)

1. Click **"Storage"** in the left sidebar.
2. Click **"New bucket"**.
3. Name: **`ar-assets`** (exactly this — the code uses this name)
4. Toggle **"Public bucket" ON**. (We need files to be publicly readable so the viewer can fetch them.)
5. Click **"Create bucket"**.

### Step 4: Allow large file uploads (30 sec)

By default Supabase caps uploads at 50 MB. If your videos might be bigger, raise it:

1. Storage → click the `ar-assets` bucket → ⚙ icon (settings) at the top.
2. Set **"File size limit"** to e.g. `200 MB` (or whatever you need).
3. Save.

### Step 5: Allow MindAR to fetch .mind files cross-origin (30 sec)

Supabase Storage already sends correct CORS headers for public buckets, so no action needed. Just confirming this works out of the box. (If you ever see a CORS error in the browser console, this is where to look — Storage → bucket settings → CORS.)

### Step 6: Get your Supabase keys (30 sec)

1. Click the ⚙ **"Project Settings"** at bottom-left → **"API"**.
2. Copy two things:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public key** (a long string starting with `eyJ...`) — this is safe to put in client-side code.

### Step 7: Paste the keys into config.js (30 sec)

Open `config.js` in this folder. Replace the placeholders:

```js
window.SUPABASE_URL      = 'https://abcdefgh.supabase.co';        // ← your URL
window.SUPABASE_ANON_KEY = 'eyJhbGciOi...';                        // ← your anon key
window.ADMIN_USER        = 'admin';                                // ← change if you want
window.ADMIN_PASS        = 'ar2024';                               // ← CHANGE THIS
```

### Step 8: Push to GitHub (2 min)

If you've never used GitHub: install **GitHub Desktop** (https://desktop.github.com), drag this folder in, click "Publish repository", make it public or private (your choice).

If you already use git from terminal:
```bash
cd ar-qr-v2
git init
git add .
git commit -m "initial"
gh repo create ar-qr-tool --public --source=. --push
```

### Step 9: Deploy to Vercel (3 min)

1. Go to **https://vercel.com** → sign in with GitHub.
2. Click **"Add New" → "Project"**.
3. Find your `ar-qr-tool` repo → click **"Import"**.
4. Leave all settings as default → click **"Deploy"**.
5. Wait ~30 seconds. You'll get a URL like `ar-qr-tool-xyz.vercel.app`.

That URL is your live site. Done.

---

## How to use it (daily workflow)

### Create a new AR experience

1. Go to `https://your-site.vercel.app/admin.html`
2. Log in (admin / ar2024 — or whatever you set).
3. Click **"+ New Experience"**.
4. Type a title (e.g. "Coca-Cola Diwali"), drop in your `.mind` file and your `.mp4` video.
5. Click **"Create"**. After upload, the QR code modal pops up automatically.
6. Click **"Download PNG"** to save the QR. Print it, embed it in marketing material, share digitally — whatever.

### What clients/users do

They scan the QR code with their phone camera → it opens `https://your-site.vercel.app/ar/abc123` → the page loads ONLY that experience's image+video → they tap "Launch AR" → point at the printed image → video plays. Each user has their own session on their own phone. 100 users scanning 100 different QRs all work independently.

### Manage existing experiences

The admin dashboard lists all experiences. Each card has:
- **QR Code** — re-open the QR modal anytime to download again
- **Open** — preview the experience yourself
- **Pause/Activate** — temporarily disable a QR without deleting (good for time-limited campaigns)
- **Delete** — permanently remove the experience and its files

---

## Local development (optional)

If you want to test changes before pushing to Vercel:

```bash
# Install Vercel CLI once
npm install -g vercel

# Run local dev server (handles the /ar/<slug> routing same as production)
vercel dev
```

Then open `http://localhost:3000/admin.html`.

The old `local-server.js` from v1 won't handle the `/ar/:slug` rewrites — use `vercel dev` instead.

---

## File-by-file summary

| File | Purpose |
|---|---|
| `index.html` | Viewer page. Reads `/ar/<slug>` from URL, fetches the matching experience from Supabase, runs MindAR. |
| `admin.html` | Dashboard. Lists experiences, creates/pauses/deletes them, generates downloadable QR codes. |
| `config.js` | Your Supabase URL + anon key + admin password. Edit this. |
| `vercel.json` | Tells Vercel that `/ar/anything` should serve `index.html` (so the URL stays clean). |
| `supabase-setup.sql` | Run this once in Supabase SQL Editor to create the table. |

---

## Things to know / gotchas

- **The anon key is public**. Anyone who visits your site can read it (it's literally in the page source). That's fine — Supabase is designed for this. Real security comes from the Row Level Security policies in `supabase-setup.sql`. For an internal tool with simple username/password admin, this is acceptable. If you ever expose this to untrusted admins, switch to Supabase Auth.
- **HTTPS is required for camera access.** Vercel gives you HTTPS automatically. Don't try to serve this over plain HTTP.
- **Free tier limits**: 1 GB storage, 5 GB bandwidth/month on Supabase. For ~50 experiences with ~15 MB videos and a few hundred scans/month, you're well inside free.
- **iOS quirk**: video autoplay only works if muted on first play. The viewer already handles this — videos start muted, user taps "Unmute" if they want sound.
- **.mind file generation**: still uses MindAR's hosted compiler at https://hiukim.github.io/mind-ar-js-doc/tools/compile — the helper link in the create modal points there.

---

## When you outgrow this

If you eventually need:
- **Multiple admins / proper login** → switch to Supabase Auth (1 hour of work)
- **Analytics on scans** → add a `scans` table, log a row from `index.html` on load (30 min)
- **Per-experience CTAs / extra buttons** → add a `config jsonb` column to the table, render in viewer (1 hour)
- **Custom domain** → add it in Vercel project settings, update DNS (10 min)

The schema is built to grow. Nothing about today's setup needs to be redone.
