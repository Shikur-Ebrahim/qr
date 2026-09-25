# 🎫 One-Time QR Event Ticket Validation System

A production-ready event ticketing system where every ticket has a unique QR code that can be scanned **exactly once**. Built with Next.js 15, TypeScript, Firebase Firestore, and Tailwind CSS.

---

## Architecture

```
Browser (camera / UI)
        ↓
Next.js Frontend (React, App Router)
        ↓
Next.js Route Handlers (server-side API)
        ↓
Firebase Admin SDK (privileged, server-only)
        ↓
Cloud Firestore (atomic transactions)
```

> **Security principle:** The frontend **never** decides whether a ticket is valid. All validation is enforced server-side with atomic Firestore transactions.

---

## Features

- 🔐 Cryptographically secure (256-bit) unique QR tokens
- ⚛️ Atomic Firestore transactions — two simultaneous scans of the same ticket can never both succeed
- 📷 Mobile camera QR scanner (works on Android, iPhone, tablet, desktop)
- 🎟️ Bulk ticket generation (1–20 tickets at once)
- ⬇️ QR code download + print support
- 🚫 Firestore security rules block all direct client-side writes
- ✅ Clear ACCEPTED / ❌ ALREADY USED / ❌ INVALID result screens

---

## Project Structure

```
app/
  page.tsx                     ← Home / navigation
  scan/page.tsx                ← Camera scanner page
  tickets/generate/page.tsx    ← Ticket generation page
  api/
    tickets/
      generate/route.ts        ← POST /api/tickets/generate
      validate/route.ts        ← POST /api/tickets/validate
  globals.css
  layout.tsx

components/
  QRScanner.tsx                ← html5-qrcode camera component
  TicketResult.tsx             ← ACCEPTED/USED/INVALID result UI

lib/
  firebase-admin.ts            ← Server-only Admin SDK singleton
  firebase-client.ts           ← Browser-safe client SDK
  qr.ts                        ← Token generation + QR PNG utilities

types/
  ticket.ts                    ← Shared TypeScript interfaces

firestore.rules                ← Deny all client-side access
firestore.indexes.json         ← Index on qrToken field
firebase.json                  ← Firebase CLI config
.env.example                   ← Environment variable template
```

---

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `event-ticket-qr`)
3. Disable Google Analytics (optional) → **Create project**

### 3. Create the Firestore Database

1. In your Firebase project → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (we'll add rules next)
4. Select a region close to your users → **Enable**

### 4. Deploy Firestore Security Rules

Option A — Firebase CLI (recommended):
```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore
```

Option B — Firebase Console:
1. Go to **Firestore → Rules**
2. Paste the contents of `firestore.rules`
3. Click **Publish**

### 5. Create Firebase Admin Credentials

1. Firebase Console → ⚙️ **Project Settings → Service Accounts**
2. Click **Generate new private key** → download the JSON file
3. Keep this file **private** — never commit it to git

### 6. Configure Environment Variables

Copy the template and fill it in:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
# Public (browser-safe) — from Firebase Console → Project Settings → General
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Server-only — from the downloaded service account JSON
FIREBASE_ADMIN_PROJECT_ID=...               # "project_id" field
FIREBASE_ADMIN_CLIENT_EMAIL=...             # "client_email" field
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# ↑ Copy the "private_key" field exactly, keep the \n characters

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000   # or your Vercel URL in production
```

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Testing Procedure

### TEST 1 — Generate a Ticket

1. Go to `/tickets/generate`
2. Click **Generate 1 Ticket**
3. **Expected:** A ticket card appears with a QR code, Ticket ID, and status **VALID**
4. Verify in Firestore Console: `tickets/{ticketId}` has `status: "VALID"`, `usedAt: null`

---

### TEST 2 — First Scan (should ACCEPT)

1. Go to `/scan`
2. Allow camera permission
3. Scan the QR code from TEST 1
4. **Expected:** ✅ **TICKET ACCEPTED** screen appears
5. Verify in Firestore: `status` is now `"USED"`, `usedAt` is set

---

### TEST 3 — Second Scan of Same Ticket (must REJECT)

1. Stay on `/scan` (or tap **Scan Next Ticket**)
2. Scan the **same** QR code again
3. **Expected:** ❌ **TICKET ALREADY USED** — must NOT say accepted

---

### TEST 4 — Invalid/Unknown QR

1. Go to `/scan`
2. Scan any random QR code (e.g., a website QR, or a QR with random text)
3. **Expected:** ❌ **INVALID TICKET**

---

### TEST 5 — Simultaneous Scan Attack (Concurrency Test)

Run these two curl commands at the same time (in two terminal windows):

```bash
# Terminal 1
curl -X POST http://localhost:3000/api/tickets/validate \
  -H "Content-Type: application/json" \
  -d '{"qrToken":"YOUR_VALID_TOKEN_HERE"}'

# Terminal 2 (run immediately after Terminal 1)
curl -X POST http://localhost:3000/api/tickets/validate \
  -H "Content-Type: application/json" \
  -d '{"qrToken":"YOUR_VALID_TOKEN_HERE"}'
```

**Expected:**
- Exactly **one** response: `{"success":true,"status":"ACCEPTED",...}`
- The other response: `{"success":false,"status":"ALREADY_USED",...}`

This is guaranteed by the Firestore transaction — optimistic concurrency ensures only one write commits.

---

### SECURITY TEST — Frontend Bypass Attempt

1. Open browser DevTools → Network tab
2. Try to call Firestore REST API directly to change `status` from `"USED"` to `"VALID"`
3. **Expected:** Firestore returns **403 PERMISSION_DENIED** because the security rules deny all client writes

---

## API Reference

### `POST /api/tickets/generate`

**Request:**
```json
{ "count": 3 }
```

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "ticketId": "uuid-here",
      "qrToken": "64-char-hex-token",
      "status": "VALID",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "qrCodeDataUrl": "data:image/png;base64,..."
    }
  ]
}
```

---

### `POST /api/tickets/validate`

**Request:**
```json
{ "qrToken": "64-char-hex-token" }
```

**Response — ACCEPTED:**
```json
{ "success": true, "status": "ACCEPTED", "message": "Ticket accepted", "ticketId": "..." }
```

**Response — ALREADY_USED:**
```json
{ "success": false, "status": "ALREADY_USED", "message": "This ticket has already been used", "ticketId": "..." }
```

**Response — INVALID:**
```json
{ "success": false, "status": "INVALID", "message": "Invalid ticket" }
```

---

## Firestore Data Model

**Collection:** `tickets`  
**Document ID:** UUID v4

```json
{
  "ticketId":  "550e8400-e29b-41d4-a716-446655440000",
  "qrToken":   "a3f9c2...64 hex chars...b7d1e8",
  "status":    "VALID",
  "createdAt": Timestamp,
  "usedAt":    null
}
```

After scan:
```json
{
  "status":  "USED",
  "usedAt":  Timestamp
}
```

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/qr-event-ticket.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Environment Variables** and add all variables from `.env.local`:
   - All `NEXT_PUBLIC_FIREBASE_*` variables
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` — paste the full key with literal `\n` characters
   - `NEXT_PUBLIC_APP_URL` — set to your Vercel URL (e.g. `https://your-app.vercel.app`)
5. Click **Deploy**

### 3. Update QR Content URL

After deploying, update `NEXT_PUBLIC_APP_URL` in Vercel environment variables to your production URL, then redeploy (or trigger a new deployment) so future QR codes embed the production URL.

---

## Security Model

| Layer | Protection |
|---|---|
| QR Token | 256-bit cryptographically secure random (impossible to guess) |
| Validation | Server-side only — frontend never decides VALID/USED |
| Atomicity | Firestore transaction — concurrent scans safe |
| Admin SDK | Never exposed to browser — server-only via `serverExternalPackages` |
| Firestore Rules | `allow read, write: if false` — all client access denied |
| Secrets | `.env.local` in `.gitignore` — never committed |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Missing Firebase Admin environment variables` | Check `.env.local` has all 3 `FIREBASE_ADMIN_*` vars set |
| `Error: Failed to parse private key` | Ensure `\n` in the key are literal backslash-n (not actual newlines) in `.env.local` |
| Camera won't open | Allow camera permission in browser; use HTTPS in production |
| `PERMISSION_DENIED` from Firestore | Good! Rules are working — API calls go through Admin SDK which bypasses rules |
| QR code scans but shows INVALID | The token in the QR doesn't match any Firestore document; regenerate |
| Build error on Vercel | Check all env vars are set in Vercel dashboard, especially the private key |
