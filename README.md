# OneView
> **Next-Generation, Privacy-Preserving Asset Distribution & Stealth Live Web Proxy Architecture**

OneView is an industrial-grade, privacy-first secure sharing platform that allows users to share confidential visual media collections and live web application links behind cryptographically secured, tokenized wrappers with dynamic session shielding, automated self-destruction, and invisible forwarding tunnels.

---

## 🏛️ Core Technology Stack
- **Framework**: [Next.js 15] with App Router and Turbopack for edge-optimized execution.
- **Language**: [TypeScript 5+] delivering flawless cross-boundary structural enforcement.
- **Database**: [Supabase PostgreSQL] ensuring relational integrity and dynamic clock synchronization (with included automatic local fallback memory/disk store for zero-config offline runs).
- **Object Storage**: [Vercel Blob] (Private Vault Mode) for non-public, signed stream pipelining (with graceful local vault fallback).
- **Styling**: High-performance Vanilla CSS Variables with native keyframe physics engine.

---

## 🛡️ System Features & Capabilities

### 🕵️ Advanced Invisible URL Proxy Tunneling
- Viewer interacts with a live destination through an isolated, sandboxed iframe stack.
- The raw target host address is **NEVER** revealed to browsers or client logs.
- Automatic backchannel response rewriting strips restrictive `X-Frame-Options` and `frame-ancestors` directives while injecting anti-tamper event blockades.

### 📸 Sophisticated Media Ingestion
- **Smart Drag-and-Drop Aggregation**: Intercepts media files natively.
- **Inter-Domain Drag Snatching**: Intercepts visual blobs directly pulled from alternate tabs and websites natively.
- **System Buffer Clipboard Injection**: Paste screenshots directly from system clipboard (`Ctrl+V` / `Cmd+V`) seamlessly.
- **Horizontal Kinetic Viewports**: Replaces standard lists with an intelligent, horizontal kinetic preview dock and full-screen lightbox inspection.

### 🛡️ High-Profile User Shield (Anti-Leak Tech)
- **Session-Bound Watermarking**: Un-removable, semi-transparent tiled grid injected dynamically across the entire visual stack with Session ID, Client Hash, and Timestamp.
- **Interactive Event Blockage**: Hard cancellation of context menu (Right-click), devtool shortcut keys (`F12`, `Ctrl+Shift+I`, `Cmd+Option+I`), and drag-starts.
- **Tab Guard Blurring**: Instantly blurs context content when viewfocus is broken or minimize actions occur.

### ⏳ Secure Lifecycle Tokens
- Generates randomized **32-character secure cryptographic seeds** + human-readable **6-character redirection codes**.
- **Single-Usage Locking**: Couples distinct viewing sessions to `oneview_session` browser cookies, ensuring secondary devices or browsers are hard-rejected upon return.
- **Custom Time Depletion**: Clock timers expiring assets anywhere from 1 to 168 hours globally.

---

## 📊 Database Schema & Architecture (`supabase/schema.sql`)
1. **`galleries`**: Central identity store containing global settings, user binding, and encrypted URL maps.
2. **`gallery_images`**: Mapping registry recording direct private pointers back to binary paths stored inside secure blobs.
3. **`share_links`**: Heavy-logic policy registry regulating real-time dynamic accessibility via expirations, single-view thresholds, and session locks.

---

## 🛠️ Subsystem API Mapping
| Method | Endpoint | Role |
| :--- | :--- | :--- |
| **POST** | `/api/upload` | Ingests bin-streams; generates encryption tokens & shortened codes. |
| **POST** | `/api/validate-token` | Main gateway; ensures clock alignment & performs device-locking. |
| **GET** | `/api/gallery` | Populates dashboard histories & provides specific item drilldowns. |
| **DELETE** | `/api/gallery` | Initiates cascade removal with Admin Escalation and Secure Revoke safeguards. |
| **GET** | `/api/proxy-site` | Executes backchannel asset fetching for masked website relay tunnels. |

---

## 🛸 Persistence & Data Consistency Engine
- **Ownership Tracking**: Maintains explicit authorization through signed server-side HTTP cookies (`oneview_creator`).
- **Local Index Caching**: Preserves interface layout continuity immediately via browser `localStorage`.
- **Inertial Suppression Ledger**: A specialized local client-blocklist prevents ghost-records or archive-leakage from resurrecting on visual refreshes, preserving 100% interface integrity upon confirmed deletions.

---

## ▶ Quick Start Setup

### 1. Install Foundations
```bash
npm install
```

### 2. Synchronize Configuration (Optional for cloud, works out-of-the-box locally)
Construct `.env.local` utilizing your unique identifiers:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_KEY

# Storage
BLOB_READ_WRITE_TOKEN=YOUR_VERCEL_BLOB_TOKEN
```

### 3. Ignite
```bash
npm run dev
# or production build & start:
npm run build
npm start
```
